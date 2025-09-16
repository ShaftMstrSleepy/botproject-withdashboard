// src/routes/appeals.js
import { Router } from "express";
import fetch from "node-fetch";
import { requireAuth } from "../middleware/auth.js";
import Appeal from "../models/Appeal.js";
import AppealConfig from "../models/AppealConfig.js";

const router = Router();
const DISCORD_API = "https://discord.com/api";

// ---------- USER FLOW ----------

// 1️⃣  List guilds user can appeal in

router.get("/", requireAuth, (req, res) => {
  // ✅ Show all mutual guilds with the bot for appeals
  const appealable = (req.session.guilds || []).filter(g =>
    req.session.guildsForAppeals?.includes(g.id)
  );
  res.render("appeals_home", { guilds: appealable });
});


// 2️⃣  Show appeal form for a specific guild
router.get("/:guildId/new", requireAuth, async (req, res) => {
  const { guildId } = req.params;
  const headers = { Authorization: `Bot ${process.env.BOT_TOKEN}` };

  // ----- Fetch guild info from Discord -----
  const guildRes = await fetch(`${DISCORD_API}/guilds/${guildId}`, { headers });
  if (!guildRes.ok) {
    return res.render("error", { message: "Failed to fetch guild info" });
  }
  const g = await guildRes.json();

  // ----- Load appeal config (welcome message, categories, thresholds) -----
  const config = (await AppealConfig.findOne({ guildId })) || {};

  // ----- Member counts via the Bot’s local Presence API -----
  // Your bot exposes this on port 3050 in index.js
  let onlineCount = 0;
  let offlineCount = 0;
  try {
    const presenceRes = await fetch(
      `http://localhost:${process.env.PRESENCE_PORT || 3050}/api/guilds/${guildId}/presence`
    );
    if (presenceRes.ok) {
      const data = await presenceRes.json();
      onlineCount = data.online || 0;
      offlineCount = (data.total || 0) - onlineCount;
    }
  } catch (err) {
    console.error("Presence API fetch failed:", err);
  }

  // ----- Active punishments for the current user (hook up to your DB later) -----
  const punishments = []; // safe default to avoid undefined in template

  // ----- Render page with all required data -----
  res.render("appeal_form", {
    guild: {
      id: guildId,
      name: g.name,
      iconURL: g.icon
        ? `https://cdn.discordapp.com/icons/${guildId}/${g.icon}.png?size=128`
        : "https://cdn.discordapp.com/embed/avatars/0.png",
      onlineCount,
      offlineCount
    },
    config,                                // ✅ always defined
    guildWelcomeMessage: config.welcomeMessage || "",
    punishments                             // ✅ always defined
  });
});

// 3️⃣  Submit appeal
router.post("/:guildId/new", requireAuth, async (req, res) => {
  const { guildId } = req.params;
  const { category, reason } = req.body;

  await Appeal.create({
    guildId,
    userId: req.session.user.id,
    category,
    reason
  });

  res.render("appeal_submitted");
});

// ---------- STAFF VOTING ----------
router.post("/:appealId/vote", requireAuth, async (req, res) => {
  const { appealId } = req.params;
  const { vote } = req.body; // "accept" or "deny"
  const appeal = await Appeal.findById(appealId);
  if (!appeal) return res.json({ error: "Appeal not found" });

  // Prevent double vote by the same staff member
  if (appeal.votes.find(v => v.staffId === req.session.user.id)) {
    return res.json({ error: "Already voted" });
  }

  appeal.votes.push({ staffId: req.session.user.id, vote });
  await appeal.save();

  const config = await AppealConfig.findOne({ guildId: appeal.guildId });
  const accepts = appeal.votes.filter(v => v.vote === "accept").length;
  const denies  = appeal.votes.filter(v => v.vote === "deny").length;

  if (config) {
    if (accepts >= config.voteThreshold.accept) {
      appeal.status = "accepted";
    } else if (denies >= config.voteThreshold.deny) {
      appeal.status = "denied";
    }
    await appeal.save();
  }

  res.json({ success: true });
});

export default router;
