// src/routes/auth.js
import { Router } from "express";
import {
  getOAuthUrl,        // now backed by getLoginUrl() and uses env CALLBACK_URL internally
  exchangeCode,
  getUser,
  getUserGuilds,
  canManageGuild
} from "../discord.js";

const router = Router();

// ----- Login: redirect to Discord OAuth -----
router.get("/login", (_req, res) => {
  // No param needed; getOAuthUrl() reads process.env.CALLBACK_URL
  return res.redirect(getOAuthUrl());
});

// ----- OAuth callback -----
router.get("/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect("/");

  try {
    const token = await exchangeCode(code);
    const user = await getUser(token.access_token);
    const guilds = await getUserGuilds(token.access_token);

    req.session.user = user;
    req.session.accessToken = token.access_token;
    req.session.guilds = guilds;

    req.session.guildsManageable = guilds
      .filter(canManageGuild)
      .map(g => g.id);

    req.session.guildsForAppeals = guilds
      .filter(g => g.permissions) // user is a member
      .map(g => g.id);

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
