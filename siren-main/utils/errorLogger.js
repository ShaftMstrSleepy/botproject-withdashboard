// siren-main/utils/errorLogger.js
const { EmbedBuilder } = require("discord.js");
const GuildConfig = require("../models/GuildConfig");

/**
 * errorLogger(client, context, err, ctx?)
 * Tries per-guild error channel first (via ctx guildId/message/interaction).
 * Falls back to process.env.ERROR_ID (single channel) if present.
 */
module.exports = async function errorLogger(client, context, err, ctx) {
  const embed = new EmbedBuilder()
    .setTitle(`❌ Error in ${context}`)
    .setDescription("```" + (err?.stack || err?.message || String(err)) + "```")
    .setColor("Red")
    .setTimestamp();

  // Try guild-scoped error log
  try {
    let guildId = null;
    if (ctx?.guildId) guildId = ctx.guildId;
    else if (ctx?.guild?.id) guildId = ctx.guild.id;

    if (guildId) {
      const gcfg = await GuildConfig.findOne({ guildId }).lean().catch(() => null);
      const errorChanId = gcfg?.logChannels?.errors;
      if (errorChanId) {
        const ch = await client.channels.fetch(errorChanId).catch(() => null);
        if (ch) {
          await ch.send({ embeds: [embed] });
          return;
        }
      }
    }
  } catch { /* ignore and fallback */ }

  // Fallback global error channel
  try {
    const fallbackId = process.env.ERROR_ID;
    if (!fallbackId) return;
    const ch = await client.channels.fetch(fallbackId).catch(() => null);
    if (ch) await ch.send({ embeds: [embed] });
  } catch (e) {
    console.error("Failed to send error log:", e);
  }
};