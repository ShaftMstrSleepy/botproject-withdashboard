const { EmbedBuilder } = require("discord.js");
const Blacklist = require("../models/Blacklist");
const logAction = require("../utils/logger");
const isOwner = require("../utils/ownerGuard");

module.exports = {
  name: "blacklist",
  description: "Owner only: Blacklist a user from bot commands",
  async execute(message, args) {
    if (!isOwner(message.author.id)) {
      return message.reply("❌ Why? Just why? Owner Only.");
    }

    const user = message.mentions.users.first() ||
      await message.client.users.fetch(args[0]).catch(() => null);
    if (!user) return message.reply("Usage: `!blacklist @User <reason>`");

    const reason = args.slice(1).join(" ") || "No reason provided";

    await Blacklist.findOneAndUpdate(
      { userId: user.id },
      { userId: user.id, reason, addedBy: message.author.id, date: new Date() },
      { upsert: true }
    );

    await logAction(message.client, "general",
      `🔒 **User Blacklisted**\n**User:** ${user.tag} (<@${user.id}>)\n**By:** ${message.author.tag}\n**Reason:** ${reason}`
    );

    const embed = new EmbedBuilder()
      .setTitle("🚫 You have been Blacklisted")
      .setDescription(`Reason: **${reason}**\n\nYou can appeal this decision using \`!appeal\`.`)
      .setColor("Red")
      .setTimestamp();

    user.send({ embeds: [embed] }).catch(() => {});
    message.reply(`✅ ${user.tag} has been blacklisted.`);
  },
};