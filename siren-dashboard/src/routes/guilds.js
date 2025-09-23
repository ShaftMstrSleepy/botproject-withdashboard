// src/routes/guilds.js
import { Router } from "express";
import fetch from "node-fetch";
import GuildConfig from "../models/GuildConfig.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const DISCORD_API = "https://discord.com/api";

/* ---------------- Guild Selection ---------------- */

router.get("/", requireAuth, (req, res) => {
  const manageable = (req.session.guilds || [])
    .filter(g => req.session.guildsManageable?.includes(g.id));
  return res.render("guilds", { guilds: manageable });
});

router.post("/select", requireAuth, (req, res) => {
  const { guildId } = req.body;
  if (!guildId || !req.session.guildsManageable?.includes(guildId)) {
    return res.render("error", { message: "Invalid or unauthorized guild." });
  }
  return res.redirect(`/guilds/${guildId}/settings`);
});

/* ---------------- Guild Settings ---------------- */

router.get("/:guildId/settings", requireAuth, async (req, res) => {
  const { guildId } = req.params;
  if (!req.session.guildsManageable?.includes(guildId)) {
    return res.render("error", { message: "You don't have permission for this guild." });
  }

  const headers = { Authorization: `Bot ${process.env.BOT_TOKEN}` };

  // ✅ use with_counts=true to fetch online/offline estimates
  const [guildRes, rolesRes, channelsRes] = await Promise.all([
    fetch(`${DISCORD_API}/guilds/${guildId}?with_counts=true`, { headers }),
    fetch(`${DISCORD_API}/guilds/${guildId}/roles`, { headers }),
    fetch(`${DISCORD_API}/guilds/${guildId}/channels`, { headers })
  ]);

  if (!guildRes.ok || !rolesRes.ok || !channelsRes.ok) {
    return res.render("error", { message: "Failed to load guild data from Discord." });
  }

  const guildData = await guildRes.json();
  const roles = (await rolesRes.json()).sort((a, b) => b.position - a.position);
  const channels = (await channelsRes.json()).filter(c => c.type === 0);

  let cfg = await GuildConfig.findOne({ guildId });
  if (!cfg) cfg = await GuildConfig.create({ guildId, guildName: "", prefix: "!" });

  const guildIconURL = guildData.icon
    ? `https://cdn.discordapp.com/icons/${guildId}/${guildData.icon}.png?size=128`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  // Add presence/member counts
  const online  = guildData.approximate_presence_count || 0;
  const offline = guildData.approximate_member_count
                ? guildData.approximate_member_count - online
                : 0;

  return res.render("guild_settings", {
    cfg,
    roles,
    channels,
    guildInfo: {
      id: guildId,
      name: guildData.name,
      iconURL: guildIconURL,
      online,
      offline
    }
  });
});

/* ---------------- Save Settings ---------------- */

router.post("/:guildId/settings", requireAuth, async (req, res) => {
  const { guildId } = req.params;
  if (!req.session.guildsManageable?.includes(guildId)) {
    return res.render("error", { message: "You don't have permission for this guild." });
  }

  const body = req.body;
  const arr = v => (Array.isArray(v) ? v : v ? [v] : []);

  await GuildConfig.findOneAndUpdate(
    { guildId },
    {
      guildName: body.guildName ?? "",
      prefix: body.prefix || "!",
      staffRoles: {
        base: body.staff_base || "",
        trialMod: body.staff_trialMod || "",
        mod: body.staff_mod || "",
        seniorMod: body.staff_seniorMod || "",
        retired: body.staff_retired || "",
        management: body.staff_management || ""
      },
      mutedRoleId: body.mutedRoleId || "",
      logChannels: {
        punishments: arr(body.log_punishments),
        promotions:  arr(body.log_promotions),
        ownership:   arr(body.log_ownership),
        appeals:     arr(body.log_appeals),
        general:     arr(body.log_general)
      },
      voteThreshold: {
        accept: Number(body.vote_accept || 3),
        deny:   Number(body.vote_deny || 3)
      }
    },
    { upsert: true }
  );

  return res.redirect(`/guilds/${guildId}/settings`);
});

export default router;