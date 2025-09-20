// utils/errorLogger.js
const { EmbedBuilder } = require("discord.js");

// Send errors to the Discord channel ID stored in .env as ERROR_ID
module.exports = async function errorLogger(client, context, err) {
  try {
    const channelId = process.env.ERROR_ID;
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