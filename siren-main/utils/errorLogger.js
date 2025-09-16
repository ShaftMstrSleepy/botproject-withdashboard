// utils/errorLogger.js
const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");

module.exports = async function errorLogger(client, context, err) {
  try {
    const channelId = config.logChannels?.errors;
    if (!channelId) return;

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle(`❌ Error in ${context}`)
      .setDescription("```" + (err?.stack || err?.message || String(err)) + "```")
      .setColor("Red")
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (e) {
    console.error("Failed to send error log to Discord:", e);
  }
};