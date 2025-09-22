const Staff = require("../models/Staff");
const GuildConfig = require("../models/GuildConfig");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "promote",
  description: "Promote a staff member through the configured staff roles",
  async execute(message, args, cfg, client) {
    try {
      if (!message.member.permissions.has("ManageRoles")) {
        return message.reply(":x: You don’t have permission to promote staff.");
      }

      const user =
        message.mentions.users.first() ||
        (args[0] && await client.users.fetch(args[0]).catch(() => null));
      if (!user) return message.reply(":warning: Please mention a user or provide a valid user ID.");

      const staffRecord = await Staff.findOne({ userId: user.id });
      if (!staffRecord) return message.reply(":x: That user is not in the staff database.");

      const member = await message.guild.members.fetch(user.id).catch(() => null);
      if (!member) return message.reply(":warning: Could not find that member in this server.");

      // ----- Load guild configuration -----
      const gcfg = cfg?.guildCfg || await GuildConfig.findOne({ guildId: message.guild.id }).lean();
      if (!gcfg || !gcfg.staffRoles) {
        return message.reply(":warning: This server has no staff roles configured. Please set them in the dashboard.");
      }

      // Support object or array for staffRoles
      const ranks = Array.isArray(gcfg.staffRoles)
        ? gcfg.staffRoles
        : [
            gcfg.staffRoles.trialMod,
            gcfg.staffRoles.mod,
            gcfg.staffRoles.seniorMod,
            gcfg.staffRoles.retired,
            gcfg.staffRoles.management
          ].filter(Boolean);

      if (ranks.length < 2) {
        return message.reply(":warning: Not enough staff ranks are configured for promotions.");
      }

      // Remove current rank role if present
      const currentRoleId = ranks[staffRecord.currentRank];
      if (currentRoleId && member.roles.cache.has(currentRoleId)) {
        await member.roles.remove(currentRoleId).catch(() => {});
      }

      if (staffRecord.currentRank >= ranks.length - 1) {
        return message.reply(":warning: This user is already at the highest rank.");
      }

      // Promote to next rank
      staffRecord.currentRank++;
      await staffRecord.save();

      const newRoleId = ranks[staffRecord.currentRank];
      if (newRoleId) {
        await member.roles.add(newRoleId).catch(() =>
          message.reply(":warning: Could not add the next rank role. Check my role hierarchy/permissions.")
        );
      }

      const newRole = message.guild.roles.cache.get(newRoleId);
      const rankName = newRole ? newRole.name : "Unknown Rank";

      // ✅ Unified logging
      const details =
        `**User Promoted:** ${user.tag} (<@${user.id}>)\n` +
        `**Promoted By:** ${message.author.tag} (<@${message.author.id}>)\n` +
        `**New Rank:** ${rankName}\n` +
        `**Date & Time:** <t:${Math.floor(Date.now() / 1000)}:F>`;

      await logAction(client, "promotions", `⬆️ **Staff Promoted**\n${details}`, message);
      return message.reply(`✅ ${user.tag} has been promoted to ${rankName}.`);
    } catch (err) {
      console.error("Promote command error:", err);
      await errorLogger(client, "promote", err, message);
      throw err;
    }
  }
};