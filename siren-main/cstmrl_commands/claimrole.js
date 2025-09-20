const CustomRole = require("../models/CustomRole");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "claimrole",
  aliases: ["claimrl"],
  description: "!claimrole <codeName> – Claim purchased role by code name",
  async execute(message, args) {
    try {
      const code = args[0]?.toLowerCase();
      if (!code) return message.reply("⚠️ Usage: !claimrole <codeName>");

      const record = await CustomRole.findOne({ userId: message.author.id, guildId: message.guild.id, codeName: code });
      if (!record) return message.reply("❌ Invalid code name.");
      if (record.claimed)
        return message.reply("❌ This role has already been claimed.");

      // Assign ownership and mark as claimed
      record.ownerId = message.author.id;
      record.claimed = true;
      await record.save();

      const role = await message.guild.roles.fetch(record.roleId).catch(() => null);
      if (!role) return message.reply("❌ Role not found in server.");

      const member = await message.guild.members.fetch(message.author.id);
      await member.roles.add(role);

      const details =
        `**User:** ${message.author.tag} (<@${message.author.id}>)\n` +
        `**Role:** ${role.name}\n` +
        `**Code:** ${code}\n` +
        `**Date & Time:** <t:${Math.floor(Date.now() / 1000)}:F>`;

      await logAction(message.client, "ownership", `🎁 **Role Claimed**\n${details}`);
      return message.reply(`✅ You now own and have been granted the role **${role.name}**.`);
    } catch (err) {
      console.error("claimrole error:", err);
      await errorLogger(message.client, "claimrole", err);
    }
  }
};