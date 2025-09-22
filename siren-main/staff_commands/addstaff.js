const Staff = require("../models/Staff");
const GuildConfig = require("../models/GuildConfig");
const logAction = require("../utils/logger");

module.exports = {
  name: "addstaff",
  description: "Add a user as staff: !addstaff <userMention|userId>",
  async execute(message, args, cfg, client) {
    try {
      if (!message.member.permissions.has("Administrator")) {
        return message.reply(":x: You do not have permission.");
      }

      const user =
        message.mentions.users.first() ||
        (args[0] && await client.users.fetch(args[0]).catch(() => null));
      if (!user) return message.reply(":warning: Please mention a user or provide their ID.");

      const existing = await Staff.findOne({ userId: user.id });
      if (existing) return message.reply(":x: This user is already staff.");

      // Fetch guild configuration
      const gcfg = cfg?.guildCfg || await GuildConfig.findOne({ guildId: message.guild.id }).lean();
      if (!gcfg) return message.reply(":x: No guild configuration found for this server.");

      const baseRoleId = gcfg.staffRoles?.base || gcfg.baseStaffRole;
      const trialRoleId = gcfg.staffRoles?.trialMod;

      if (!baseRoleId) {
        return message.reply(":warning: A base staff role has not been set in the dashboard for this server. Please configure it before using this command.");
      }

      const member = await message.guild.members.fetch(user.id).catch(() => null);
      if (!member) return message.reply(":warning: Could not find that member in this server.");

      // Give base staff role
      const baseRole = message.guild.roles.cache.get(baseRoleId);
      if (baseRole && !member.roles.cache.has(baseRole.id)) {
        await member.roles.add(baseRole).catch(() => {
          message.reply(":warning: I could not add the base staff role. Check my role hierarchy and permissions.");
        });
      }

      // Give trial mod role if set
      if (trialRoleId) {
        const trialRole = message.guild.roles.cache.get(trialRoleId);
        if (trialRole && !member.roles.cache.has(trialRole.id)) {
          await member.roles.add(trialRole).catch(() => {
            message.reply(":warning: I could not add the trial mod role. Check my role hierarchy and permissions.");
          });
        }
      }

      // Save to staff DB
      const newStaff = new Staff({ userId: user.id, currentRank: 0 });
      await newStaff.save();

      // ✅ Unified logging format
      const details =
        `**User Added:** ${user.tag} (<@${user.id}>)\n` +
        `**Added By:** ${message.author.tag} (<@${message.author.id}>)\n` +
        `**Date & Time:** <t:${Math.floor(Date.now() / 1000)}:F>`;

      await logAction(message.client, "promotions", `🟢 **Staff Added**\n${details}`, message);
      return message.reply(`✅ ${user.tag} has been added as staff and assigned the base staff role${trialRoleId ? " and trial mod role" : ""}.`);
    } catch (err) {
      console.error("AddStaff command error:", err);
      return message.reply("❌ There was an error adding this staff member.");
    }
  }
};