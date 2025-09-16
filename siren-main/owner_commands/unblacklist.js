// commands/unblacklist.js
const { EmbedBuilder } = require("discord.js");
const Blacklist = require("../models/Blacklist"); // <- same model used for blacklist command
const config = require("../config.json");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "unblacklist",
  description: "Owner/Management: Remove a user from the blacklist",
  async execute(message, args) {
    try {
      // ── Permission check ──
      if (
        message.author.id !== config.ownerId &&
        !message.member.roles.cache.has("1232894786684588062") // management role
      ) {
        return message.reply("❌ Only the Owner or Management can un-blacklist a user.");
      }

      // ── Identify user ──
      const user =
        message.mentions.users.first() ||
        (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);

      if (!user) {
        return message.reply("⚠️ Usage: `!unblacklist <@user|ID>`");
      }

      // ── Remove from DB ──
      const record = await Blacklist.findOneAndDelete({ userId: user.id });
      if (!record) {
        return message.reply("⚠️ That user is not currently blacklisted.");
      }

      // ── Create an embed for confirmation/logging ──
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

      // ── DM the user to notify them ──
      await user.send(
        `✅ You have been **un-blacklisted** in **${message.guild.name}**. You can now use normal bot commands again.`
      ).catch(() => {});

      // ── Log to the Blacklist log channel ──
      await logAction(message.client, "blacklist", null, { embeds: [embed] });

      // ── Confirm in the channel ──
      return message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("unblacklist error:", err);
      await errorLogger(message.client, "unblacklist", err);
      return message.reply("❌ There was an error removing the user from the blacklist.");
    }
  }
};