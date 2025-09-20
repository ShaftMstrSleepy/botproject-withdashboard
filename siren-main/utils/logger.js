// siren-main/utils/logger.js
const { EmbedBuilder } = require("discord.js");
const GuildConfig = require("../models/GuildConfig");

/**
 * logAction(client, key, text, ctx?)
 * - key: "promotions" | "punishments" | "appeals" | "ownership" | "general" | "blacklist" | ...
 * - text: string OR null (if you plan to send your own embed via ctx.embed)
 * - ctx (optional): one of
 *    { guildId?: string, embed?: EmbedBuilder }
 *    OR a Discord.js Message/Interaction with .guild?.id
 */
module.exports = async function logAction(client, key, text, ctx) {
  try {
    // Resolve guildId from ctx
    let guildId = null;
    if (ctx?.guildId) guildId = ctx.guildId;
    else if (ctx?.guild?.id) guildId = ctx.guild.id;

    if (!guildId) {
      // No guild context — nothing to do safely
      return;
    }

    const gcfg = await GuildConfig.findOne({ guildId }).lean().catch(() => null);
    const chanId = gcfg?.logChannels?.[key];
    if (!chanId) return;

    const channel = await client.channels.fetch(chanId).catch(() => null);
    if (!channel) return;

    let embed;
    if (ctx?.embed) {
      embed = ctx.embed;
    } else {
      embed = new EmbedBuilder()
        .setTitle(`🔔 ${key.charAt(0).toUpperCase() + key.slice(1)} Log`)
        .setDescription(text || "")
        .setColor("Blue")
        .setTimestamp();
    }

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error("Logger error:", err);
  }
};