const Staff = require("../models/Staff");
const config = require("../config");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "promote",
  description: "Promote a staff member through your configured staff roles",
  async execute(message, args, _cfg, client) {
    try {
      if (!message.member.permissions.has("ManageRoles")) {
        return message.reply("❌ You don’t have permission to promote staff.");
      }

      const user =
        message.mentions.users.first() ||
        (args[0] && await client.users.fetch(args[0]).catch(() => null));
      if (!user) return message.reply("⚠️ Please mention a user or provide a valid user ID.");

      const staffRecord = await Staff.findOne({ userId: user.id });
      if (!staffRecord) return message.reply("❌ That user is not in the staff database.");

      const member = await message.guild.members.fetch(user.id).catch(() => null);
      if (!member) return message.reply("⚠️ Could not find that member in this server.");

      const ranks = config.staffRoles; // ordered lowest → highest
      if (!Array.isArray(ranks) || ranks.length < 2) {
        return message.reply("⚠️ Please configure staffRoles in config.json with role IDs in ascending order.");
      }

      // Remove current role if present
      const currentRoleId = ranks[staffRecord.currentRank];
      if (currentRoleId) await member.roles.remove(currentRoleId);

      // Stop if already at highest rank
      if (staffRecord.currentRank >= ranks.length - 1) {
        return message.reply("⚠️ This user is already at the highest rank.");
      }

      // Promote and save
      staffRecord.currentRank++;
      await staffRecord.save();

      // Add the new role
      const newRoleId = ranks[staffRecord.currentRank];
      await member.roles.add(newRoleId);

      // Remove base Staff role if promoted to top rank
      if (staffRecord.currentRank === ranks.length - 1 && config.baseStaffRole) {
        const baseStaffRole = message.guild.roles.cache.get(config.baseStaffRole);
        if (baseStaffRole && member.roles.cache.has(baseStaffRole.id)) {
          await member.roles.remove(baseStaffRole);
        }
      }

      // ✅ Get the new rank name directly from the guild role
      const newRole = message.guild.roles.cache.get(newRoleId);
      const rankName = newRole ? newRole.name : "Unknown Rank";

      // 🔵 Detailed Promotion Log
      const promotionDetails =
        `**User Promoted:** ${user.tag} (<@${user.id}>)\n` +
        `**Promoted By:** ${message.author.tag} (<@${message.author.id}>)\n` +
        `**New Rank:** ${rankName}\n` +
        `**Date & Time:** <t:${Math.floor(Date.now() / 1000)}:F>`;

      await logAction(client, "promotions", `⬆️ **Staff Promoted**\n${promotionDetails}`);

      return message.reply(`✅ ${user.tag} has been promoted to ${rankName}.`);
    } catch (err) {
      console.error("Promote command error:", err);
      await errorLogger(client, "promote", err);
      throw err;
    }
  }
};