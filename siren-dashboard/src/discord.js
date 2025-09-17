// src/discord.js
import axios from "axios";

const DISCORD_API = "https://discord.com/api/v10";

// =============== ENV ===============
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const CALLBACK_URL = (process.env.CALLBACK_URL || "").trim(); // e.g. https://sirenmod.com/auth/callback

if (!CLIENT_ID || !CLIENT_SECRET || !CALLBACK_URL) {
  console.error("[discord.js] Missing required env: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, CALLBACK_URL");
  // Don't throw here; app can still boot, but login will fail until fixed.
}

// =============== OAUTH URL (LOGIN ONLY) ===============
// IMPORTANT: This is for **user login** to the dashboard.
// Keep the scopes to what's needed for login (identify, guilds). Do NOT include "bot" here.
// If you want a bot invite link, use a separate function.
export function getLoginUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: CALLBACK_URL,  // MUST EXACTLY MATCH the one in the Discord Dev Portal
    response_type: "code",
    scope: "identify guilds",    // keep clean for dashboard login
    prompt: "none",
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

// Backward compatibility with existing import name:
export const getOAuthUrl = getLoginUrl;

// =============== TOKEN EXCHANGE ===============
export async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: CALLBACK_URL,  // must match exactly
  });

  const { data } = await axios.post(`${DISCORD_API}/oauth2/token`, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  // data: { access_token, token_type, expires_in, refresh_token, scope }
  return data;
}

// Optional: refresh flow if you ever need it
export async function refreshToken(refresh_token) {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token,
  });

  const { data } = await axios.post(`${DISCORD_API}/oauth2/token`, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return data;
}

// =============== DISCORD API HELPERS ===============
export async function getUser(access_token) {
  const { data } = await axios.get(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  return data; // { id, username, global_name, avatar, ... }
}

export async function getUserGuilds(access_token) {
  const { data } = await axios.get(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  return data; // [{ id, name, permissions, owner, ... }]
}

// Helper: can the user manage a guild?
export function canManageGuild(g) {
  const MANAGE_GUILD = 0x20;
  return (g.permissions & MANAGE_GUILD) === MANAGE_GUILD;
}

// (Optional) Separate bot invite URL if you need it on the site
export function getBotInviteUrl({ permissions = "8", guild_id } = {}) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: "bot applications.commands",
    permissions, // 8 = Administrator; choose your own bitfield
  });
  if (guild_id) params.set("guild_id", guild_id);
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}
