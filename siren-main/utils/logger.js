// utils/logger.js
const { EmbedBuilder } = require("discord.js");
const config = require("../config"); // now reads from .env

module.exports = async function logAction(client, key, text) {
  try {
    // look up channel ID from env-driven config (GuildConfig can override per guild)
    const channelId = config.LOG_CHANNELS?.[key] || process.env[`LOG_${key.toUpperCase()}_ID`];
    if (!channelId) return;

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    const title =
      key === "ownership"
        ? "Role Ownership Log"
        : `${key.charAt(0).toUpperCase() + key.slice(1)} Log`;

    const embed = new EmbedBuilder()
      .setTitle(`🔔 ${title}`)
      .setDescription(text)
      .setColor("Blue")
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error("Logger error:", err);
    const errorLogger = require("./errorLogger");
    await errorLogger(client, `logger-${key}`, err);
  }
};