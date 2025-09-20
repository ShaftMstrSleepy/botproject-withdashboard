const Staff = require("../models/Staff");
const GuildConfig = require("../models/GuildConfig");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "demote",
  description: "Demote a staff member down one rank",
  async execute(message, args, cfg, client) {
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

      const gcfg = cfg?.guildCfg || await GuildConfig.findOne({ guildId: message.guild.id }).lean();
      const ranks = gcfg?.staffRoles || [];
      if (ranks.length < 2) {
        return message.reply("⚠️ Please set staff roles in the dashboard first.");
      }

      if (staffRecord.currentRank <= 0) {
        return message.reply("⚠️ This user is already at the lowest rank.");
      }

      const currentRoleId = ranks[staffRecord.currentRank];
      if (currentRoleId) await member.roles.remove(currentRoleId).catch(() => {});

      staffRecord.currentRank--;
      await staffRecord.save();

      const newRoleId = ranks[staffRecord.currentRank];
      await member.roles.add(newRoleId);

      if (gcfg.baseStaffRole) {
        const baseStaffRole = message.guild.roles.cache.get(gcfg.baseStaffRole);
        if (baseStaffRole && !member.roles.cache.has(baseStaffRole.id)) {
          await member.roles.add(baseStaffRole);
        }
      }

      const newRankRole = message.guild.roles.cache.get(newRoleId);
      const rankName = newRankRole ? newRankRole.name : "Unknown Rank";

      const details =
        `**User Demoted:** ${user.tag} (<@${user.id}>)\n` +
        `**Demoted By:** ${message.author.tag} (<@${message.author.id}>)\n` +
        `**New Rank:** ${rankName}\n` +
        `**Date & Time:** <t:${Math.floor(Date.now() / 1000)}:F>`;

      await logAction(client, "promotions", `⬇️ **Staff Demoted**\n${details}`, message);
      return message.reply(`✅ ${user.tag} has been demoted to ${rankName}.`);
    } catch (err) {
      console.error("Demote command error:", err);
      await errorLogger(client, "demote", err, message);
      throw err;
    }
  }
};