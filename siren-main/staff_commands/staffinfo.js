const { EmbedBuilder } = require("discord.js");
const Staff = require("../models/Staff");

module.exports = {
  name: "staffinfo",
  description: "View detailed staff info (ManageRoles or Owner)",
  async execute(message, args) {
    const isOwner = message.client.application?.owner?.id
      ? message.author.id === message.client.application.owner.id
      : false;
    const hasManage = message.member.permissions.has("ManageRoles");
    if (!isOwner && !hasManage) {
      return message.reply("❌ You do not have permission to use this command.");
    }

    const targetUser =
      message.mentions.users.first() ||
      (args[0] && await message.client.users.fetch(args[0]).catch(() => null));
    if (!targetUser) {
      return message.reply("⚠️ Please mention a user or provide a valid user ID.");
    }

    const staffRecord = await Staff.findOne({ userId: targetUser.id });
    if (!staffRecord) {
      return message.reply("❌ That user is not in the staff database.");
    }

    const embed = new EmbedBuilder()
      .setTitle("📋 Staff Information")
      .setColor("Blue")
      .addFields(
        { name: "User", value: `${targetUser.tag} (<@${targetUser.id}>)` },
        { name: "Current Rank Index", value: String(staffRecord.currentRank), inline: true },
        { name: "Join Date", value: staffRecord.createdAt?.toLocaleString() || "Unknown", inline: true }
      )
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }
};