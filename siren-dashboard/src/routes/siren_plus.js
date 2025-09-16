// src/routes/siren_plus.js
import { Router } from "express";
import Stripe from "stripe";
import { requireAuth } from "../middleware/auth.js";
import GuildConfig from "../models/GuildConfig.js";

const router = Router();

// ---- Stripe setup ----
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Map plan -> Stripe price id
const PRICE_MAP = {
  roles: process.env.STRIPE_PRICE_ROLES,
  troll: process.env.STRIPE_PRICE_TROLL
};

// Format helper
function formatDateTime(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}

// Purchase code helper (simple)
function randomCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

// ----- Show page -----
router.get("/", requireAuth, async (req, res) => {
  // For the page we want to show any subs on any guilds this user can manage
  const user = req.session.user;
  const manageableIds = (req.session.guilds || [])
    .filter(g => (g.permissions & 0x20) === 0x20) // Manage Guild bit
    .map(g => g.id);

  const cfgs = await GuildConfig.find({ guildId: { $in: manageableIds } }).lean();

  // Build a lightweight list with subscription-like info.
  // If you store stripe subscription/customer IDs, fetch them here to show exact status.
  const subs = cfgs
    .filter(c => c.sirenPlus?.active || c.sirenPlus?.cancelAt)
    .map(c => {
      const endsAt = c.sirenPlus?.cancelAt ? new Date(c.sirenPlus.cancelAt).getTime() / 1000 : null;
      return {
        guildId: c.guildId,
        guildName: c.guildName || c.guildId,
        planLabel: c.sirenPlus?.plan === "roles" ? "Siren Plus (Roles)" :
                   c.sirenPlus?.plan === "troll" ? "Troll Cmds" : "Unknown",
        status: c.sirenPlus?.active ? "active" : "inactive",
        currentPeriodEndStr: endsAt ? new Date(endsAt * 1000).toLocaleString() : "—",
        cancelAtPeriodEnd: !!c.sirenPlus?.cancelAt,
        canCancel: !!c.sirenPlus?.active,
        subscriptionId: c.sirenPlus?.subscriptionId || "" // optional, if you store it via webhook
      };
    });

  res.render("siren_plus", {
    subs,
    botAvatarURL: process.env.BOT_AVATAR_URL || "https://cdn.discordapp.com/embed/avatars/1.png"
  });
});

// ----- Create Checkout Session -----
router.post("/checkout", requireAuth, async (req, res) => {
  const { plan } = req.body;
  const price = PRICE_MAP[plan];
  if (!price) return res.render("error", { message: "Invalid plan." });

  // Pick a guild to associate the sub with:
  // If you prefer, make the user select a guild first; for now use the first manageable guild.
  const manageable = (req.session.guilds || []).filter(g => (g.permissions & 0x20) === 0x20);
  if (!manageable.length) return res.render("error", { message: "No manageable servers found." });

  const guildId = manageable[0].id; // TODO: or render a picker to choose guild
  const successUrl = `${process.env.BASE_URL || "http://localhost:3000"}/siren_plus`;
  const cancelUrl  = `${process.env.BASE_URL || "http://localhost:3000"}/siren_plus`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: req.session.user.id,
      guildId,
      plan
    }
  });

  res.redirect(session.url);
});

// ----- Cancel at period end -----
router.post("/cancel/:subId", requireAuth, async (req, res) => {
  const { subId } = req.params;
  try {
    await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
    res.redirect("/siren_plus");
  } catch (e) {
    console.error("Stripe cancel error:", e);
    res.render("error", { message: "Failed to cancel subscription." });
  }
});

// ----- Stripe Webhook -----
// Be sure to set the raw body parser for this route in your server.js if needed.
// If you already use express.json(), do this route BEFORE it or use a raw route handler.
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const sess = event.data.object;
      const { guildId, plan } = sess.metadata || {};
      if (guildId && plan) {
        // activate Siren Plus for this guild
        const cfg = await GuildConfig.findOneAndUpdate(
          { guildId },
          {
            $set: {
              "sirenPlus.active": true,
              "sirenPlus.plan": plan,
              "sirenPlus.features.roles": plan === "roles",
              "sirenPlus.features.troll": plan === "troll",
              "sirenPlus.subscriptionId": sess.subscription || "",
              "sirenPlus.cancelAt": null
            }
          },
          { new: true, upsert: true }
        );
        // ensure purchase code
        if (!cfg.sirenPlus.purchaseCode) {
          cfg.sirenPlus.purchaseCode = randomCode();
          await cfg.save();
        }
      }
    }

    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object;
      const cancelAtPeriodEnd = sub.cancel_at_period_end;
      const currentPeriodEnd = sub.current_period_end; // unix ts

      // We need to know which guild this belongs to. We set subscriptionId earlier.
      const cfg = await GuildConfig.findOne({ "sirenPlus.subscriptionId": sub.id });
      if (cfg) {
        cfg.sirenPlus.cancelAt = cancelAtPeriodEnd ? new Date(currentPeriodEnd * 1000) : null;
        await cfg.save();
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const cfg = await GuildConfig.findOne({ "sirenPlus.subscriptionId": sub.id });
      if (cfg) {
        // deactivate immediately
        cfg.sirenPlus.active = false;
        cfg.sirenPlus.features.roles = false;
        cfg.sirenPlus.features.troll = false;
        cfg.sirenPlus.plan = "";
        cfg.sirenPlus.cancelAt = null;
        await cfg.save();
      }
    }
  } catch (err) {
    console.error("Webhook handling error:", err);
    return res.status(500).send("Webhook handler failed");
  }

  res.json({ received: true });
});

export default router;
