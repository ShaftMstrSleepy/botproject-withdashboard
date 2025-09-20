// siren-main/config.js
// Centralized config backed by environment variables (.env)

const toList = (v) =>
  (v || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

const cfg = {
  // tokens / connections
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  MONGO_URI: process.env.MONGO_URI,

  // ids
  OWNER_IDS: toList(process.env.OWNER_IDS),
  STAFF_ROLE_IDS: toList(process.env.STAFF_ROLE_IDS),
  ADMIN_ROLE_IDS: toList(process.env.ADMIN_ROLE_IDS),

  // misc
  BLACKLIST_APPEAL_URL: process.env.BLACKLIST_APPEAL_URL,
};

// Backwards-compatible aliases in case old code used camelCase or other keys
cfg.token = cfg.DISCORD_TOKEN;
cfg.mongoUri = cfg.MONGO_URI;
cfg.ownerIds = cfg.OWNER_IDS;
cfg.staffRoleIds = cfg.STAFF_ROLE_IDS;
cfg.adminRoleIds = cfg.ADMIN_ROLE_IDS;
cfg.muteRoleId = cfg.MUTE_ROLE_ID;
cfg.modlogChannelId = cfg.MODLOG_CHANNEL_ID;
cfg.appealUrl = cfg.BLACKLIST_APPEAL_URL;
cfg.guildId = cfg.GUILD_ID;

module.exports = cfg;