const Staff = require("../models/Staff");
const config = require("../config.json");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "demote",
  description: "Demote a staff member down one rank",
  async execute(message, args, _cfg, client) {
    try {
      if (!message.member.permissions.has("ManageRoles")) {
        return message.reply("❌ You don’t have permission to demote staff.");
      }

      const user =
        message.mentions.users.first() ||
        (args[0] && await client.users.fetch(args[0]).catch(() => null));
      if (!user) return message.reply("⚠️ Please mention a user or provide a valid user ID.");

      const staffRecord = await Staff.findOne({ userId: user.id });
      if (!staffRecord) return message.reply("❌ That user is not in the staff database.");

      const member = await message.guild.members.fetch(user.id).catch(() => null);
      if (!member) return message.reply("⚠️ Could not find that member in this server.");

      const ranks = config.staffRoles; // e.g. [TrialModID, SeniorModID, AdminID]
      if (!Array.isArray(ranks) || ranks.length < 2) {
        return message.reply("⚠️ Please configure staffRoles in config.json with your rank IDs in order.");
      }

      // Already at the lowest rank?
      if (staffRecord.currentRank <= 0) {
        return message.reply("⚠️ This user is already at the lowest rank.");
      }

      // Remove current role
      const currentRoleId = ranks[staffRecord.currentRank];
      if (currentRoleId) await member.roles.remove(currentRoleId);

      // Decrement rank and save
      staffRecord.currentRank--;
      await staffRecord.save();

      // Add the new lower rank role
      const newRoleId = ranks[staffRecord.currentRank];
      await member.roles.add(newRoleId);

      // Add base Staff role if missing
      if (config.baseStaffRole) {
        const baseStaffRole = message.guild.roles.cache.get(config.baseStaffRole);
        if (baseStaffRole && !member.roles.cache.has(baseStaffRole.id)) {
          await member.roles.add(baseStaffRole);
        }
      }

      // ✅ Get the new rank name directly from the guild
      const newRankRole = message.guild.roles.cache.get(newRoleId);
      const rankName = newRankRole ? newRankRole.name : "Unknown Rank";

      // 🔻 Detailed Demotion Log
      const demotionDetails =
        `**User Demoted:** ${user.tag} (<@${user.id}>)\n` +
        `**Demoted By:** ${message.author.tag} (<@${message.author.id}>)\n` +
        `**New Rank:** ${rankName}\n` +
        `**Date & Time:** <t:${Math.floor(Date.now() / 1000)}:F>`;

      await logAction(client, "promotions", `⬇️ **Staff Demoted**\n${demotionDetails}`);

      return message.reply(`✅ ${user.tag} has been demoted to ${rankName}.`);
    } catch (err) {
      console.error("Demote command error:", err);
      await errorLogger(client, "demote", err);
      throw err;
    }
  }
};