const { EmbedBuilder } = require("discord.js");
const Blacklist = require("../models/Blacklist");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");
const isOwner = require("../utils/ownerGuard");

module.exports = {
  name: "unblacklist",
  description: "Owner only: Remove a user from the blacklist",
  async execute(message, args) {
    if (!isOwner(message.author.id)) {
      return message.reply("❌ This command is owner-only.");
    }

    const user =
      message.mentions.users.first() ||
      (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!user) return message.reply("⚠️ Usage: `!unblacklist <@user|ID>`");

    try {
      const record = await Blacklist.findOneAndDelete({ userId: user.id });
      if (!record) return message.reply("⚠️ That user is not currently blacklisted.");

      const embed = new EmbedBuilder()
        .setTitle("✅ User Un-Blacklisted")
        .setColor("Green")
        .setDescription(
          `**User:** ${user.tag} (<@${user.id}>)\n` +
          `**Removed By:** ${message.author.tag} (<@${message.author.id}>)\n` +
          `**Original Reason:** ${record.reason || "N/A"}\n` +
          `**Date & Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
        )
        .setTimestamp();

      await user.send(
        `✅ You have been **un-blacklisted** and may now use normal bot commands again.`
      ).catch(() => {});

      await logAction(message.client, "blacklist", null, { embeds: [embed] });
      return message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("unblacklist error:", err);
      await errorLogger(message.client, "unblacklist", err);
      return message.reply("❌ There was an error removing the user from the blacklist.");
    }
  },
};