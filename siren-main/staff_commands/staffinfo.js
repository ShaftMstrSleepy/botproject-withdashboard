const { EmbedBuilder } = require("discord.js");
const Staff = require("../models/Staff");
const config = require("../config.json");

module.exports = {
  name: "staffinfo",
  description: "View detailed staff info (Management/Owner only)",
  async execute(message, args) {
    // ✅ Only Owner or Management role
    const isOwner = message.author.id === config.ownerId;
    const hasManagement = message.member.roles.cache.has("1232894786684588062");
    if (!isOwner && !hasManagement) {
      return message.reply("❌ You do not have permission to use this command.");
    }

    // User to inspect
    const targetUser =
      message.mentions.users.first() ||
      (args[0] && await message.client.users.fetch(args[0]).catch(() => null));
    if (!targetUser) {
      return message.reply("⚠️ Please mention a user or provide a valid user ID.");
    }

    // Look up staff record
    const staffRecord = await Staff.findOne({ userId: targetUser.id });
    if (!staffRecord) {
      return message.reply("❌ That user is not in the staff database.");
    }

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle("📋 Staff Information")
      .setColor("Blue")
      .addFields(
        { name: "User", value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: false },
        { name: "Current Rank Index", value: `${staffRecord.currentRank}`, inline: true },
        { name: "Join Date", value: staffRecord.createdAt?.toLocaleString() || "Unknown", inline: true }
      )
      .setFooter({ text: `Requested by ${message.author.tag}` })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }
};