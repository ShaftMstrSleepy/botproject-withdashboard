const Staff = require("../models/Staff");
const config = require("../config");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "removestaff",
  description: "Completely remove a staff member from the staff database and roles",
  async execute(message, args, _cfg, client) {
    try {
      if (!message.member.permissions.has("ManageRoles")) {
        return message.reply("❌ You don’t have permission to remove staff.");
      }

      const user =
        message.mentions.users.first() ||
        (args[0] && await client.users.fetch(args[0]).catch(() => null));
      if (!user) return message.reply("⚠️ Please mention a user or provide a valid user ID.");

      const staffRecord = await Staff.findOne({ userId: user.id });
      if (!staffRecord) return message.reply("❌ That user is not in the staff database.");

      const member = await message.guild.members.fetch(user.id).catch(() => null);
      if (!member) return message.reply("⚠️ Could not find that member in this server.");

      // Remove all configured staff roles
      for (const roleId of config.staffRoles) {
        const role = message.guild.roles.cache.get(roleId);
        if (role && member.roles.cache.has(role.id)) {
          await member.roles.remove(role.id).catch(() => {});
        }
      }

      // Remove base staff role if present
      if (config.baseStaffRole) {
        const baseStaffRole = message.guild.roles.cache.get(config.baseStaffRole);
        if (baseStaffRole && member.roles.cache.has(baseStaffRole.id)) {
          await member.roles.remove(baseStaffRole).catch(() => {});
        }
      }

      // Delete their staff record from DB
      await Staff.deleteOne({ userId: user.id });

      // ✅ Detailed Removal Log
      const removalDetails =
        `**User Removed:** ${user.tag} (<@${user.id}>)\n` +
        `**Removed By:** ${message.author.tag} (<@${message.author.id}>)\n` +
        `**Date & Time:** <t:${Math.floor(Date.now() / 1000)}:F>`;

      await logAction(client, "promotions", `🗑️ **Staff Removed**\n${removalDetails}`);

      return message.reply(`✅ ${user.tag} has been removed from the staff team.`);
    } catch (err) {
      console.error("RemoveStaff command error:", err);
      await errorLogger(client, "removestaff", err);
      throw err;
    }
  }
};