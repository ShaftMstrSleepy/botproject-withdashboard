import axios from "axios";

const DISCORD_API = "https://discord.com/api";

export function getOAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify guilds"
  });
  return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.DISCORD_REDIRECT_URI
  });
  const { data } = await axios.post(`${DISCORD_API}/oauth2/token`, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  return data; // {access_token, token_type, scope, expires_in, refresh_token}
}

export async function getUser(accessToken) {
  const { data } = await axios.get(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return data; // { id, username, global_name, avatar, ...}
}

export async function getUserGuilds(accessToken) {
  const { data } = await axios.get(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return data; // array of guilds with permissions
}

// utility: check if user can manage a guild
export function canManageGuild(g) {
  // Discord perms flag: MANAGE_GUILD = 0x20 (32), ADMINISTRATOR = 0x8 (8)
  return (g.permissions & 0x20) === 0x20 || (g.permissions & 0x8) === 0x8;
}
