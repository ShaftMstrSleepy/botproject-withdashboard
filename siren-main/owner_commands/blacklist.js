const { EmbedBuilder } = require("discord.js");
const Blacklist = require("../models/Blacklist");
const config = require("../config.json");
const logAction = require("../utils/logger");

module.exports = {
  name: "blacklist",
  description: "Owner/Management: Blacklist a user from bot commands",
  async execute(message, args) {
    if (message.author.id !== config.ownerId &&
        !message.member.roles.cache.has("1232894786684588062")) {
      return message.reply("❌ Only Owner or Management can blacklist users.");
    }

    const user = message.mentions.users.first() ||
      await message.client.users.fetch(args[0]).catch(() => null);
    const reason = args.slice(1).join(" ") || "No reason provided";
    if (!user) return message.reply("Usage: `!blacklist @User <reason>`");

    await Blacklist.findOneAndUpdate(
      { userId: user.id },
      { userId: user.id, reason, addedBy: message.author.id, date: new Date() },
      { upsert: true }
    );

    const details =
      `**User:** ${user.tag} (<@${user.id}>)\n` +
      `**Blacklisted By:** ${message.author.tag} (<@${message.author.id}>)\n` +
      `**Reason:** ${reason}\n` +
      `**Date & Time:** <t:${Math.floor(Date.now()/1000)}:F>`;
    await logAction(message.client, "general", `🔒 **User Blacklisted**\n${details}`);

    const embed = new EmbedBuilder()
      .setTitle("🚫 You have been Blacklisted")
      .setDescription(
        `Reason: **${reason}**\n\nYou can appeal this decision using \`!appeal\`.`
      )
      .setColor("Red")
      .setTimestamp();
    user.send({ embeds: [embed] }).catch(() => {});

    message.reply(`✅ ${user.tag} has been blacklisted.`);
  }
};