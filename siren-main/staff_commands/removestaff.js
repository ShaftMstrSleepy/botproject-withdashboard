const Staff = require("../models/Staff");
const GuildConfig = require("../models/GuildConfig");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "removestaff",
  description: "Completely remove a staff member from the staff database and roles",
  async execute(message, args, cfg, client) {
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

      const gcfg = cfg?.guildCfg || await GuildConfig.findOne({ guildId: message.guild.id }).lean();
      const ranks = gcfg?.staffRoles || [];

      for (const roleId of ranks) {
        if (member.roles.cache.has(roleId)) {
          await member.roles.remove(roleId).catch(() => {});
        }
      }

      if (gcfg?.baseStaffRole && member.roles.cache.has(gcfg.baseStaffRole)) {
        await member.roles.remove(gcfg.baseStaffRole).catch(() => {});
      }

      await Staff.deleteOne({ userId: user.id });

      const details =
        `**User Removed:** ${user.tag} (<@${user.id}>)\n` +
        `**Removed By:** ${message.author.tag} (<@${message.author.id}>)\n` +
        `**Date & Time:** <t:${Math.floor(Date.now() / 1000)}:F>`;

      await logAction(client, "promotions", `🗑️ **Staff Removed**\n${details}`, message);
      return message.reply(`✅ ${user.tag} has been removed from the staff team.`);
    } catch (err) {
      console.error("RemoveStaff command error:", err);
      await errorLogger(client, "removestaff", err, message);
      throw err;
    }
  }
};