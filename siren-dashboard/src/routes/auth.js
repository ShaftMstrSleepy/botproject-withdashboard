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
  // Ensure getOAuthUrl() uses process.env.CALLBACK_URL
  return res.redirect(getOAuthUrl(process.env.CALLBACK_URL));
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
      .filter(g => g.permissions)
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
