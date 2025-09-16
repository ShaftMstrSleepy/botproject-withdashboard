// src/routes/auth.js
import { Router } from "express";
import {
  getOAuthUrl,
  exchangeCode,
  getUser,
  getUserGuilds,
  canManageGuild
} from "../discord.js";

const router = Router();

// ----- Login: redirect to Discord OAuth -----
router.get("/login", (req, res) => {
  // Make sure getOAuthUrl() uses scopes:
  // identify guilds guilds.members.read applications.commands bot
  return res.redirect(getOAuthUrl());
});

// ----- OAuth callback -----
router.get("/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect("/");

  try {
    // Exchange code for token
    const token = await exchangeCode(code);

    // Get basic user info
    const user = await getUser(token.access_token);

    // Get all guilds user belongs to
    const guilds = await getUserGuilds(token.access_token);

    // ✅ Store everything in the session
    req.session.user = user; // {id, username, ...}
    req.session.accessToken = token.access_token;
    req.session.guilds = guilds;

    // ✅ Servers user can MANAGE (for bot settings)
    req.session.guildsManageable = guilds
      .filter(canManageGuild)
      .map(g => g.id);

    // ✅ Servers user can APPEAL in (bot must also be in the guild)
    // We only need the bot to be present; no Manage Server required.
    req.session.guildsForAppeals = guilds
      .filter(g => g.permissions) // user is a member
      .map(g => g.id);

    // Redirect to guild selection page
    return res.redirect("/guilds");
  } catch (e) {
    console.error("OAuth callback error:", e?.response?.data || e);
    return res.render("error", { message: "OAuth failed." });
  }
});

// ----- Logout -----
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

export default router;
