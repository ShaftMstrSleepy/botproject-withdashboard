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
        return message.reply(":x: You don’t have permission to demote staff.");
      }

      const user =
        message.mentions.users.first() ||
        (args[0] && await client.users.fetch(args[0]).catch(() => null));
      if (!user) return message.reply(":warning: Please mention a user or provide a valid user ID.");

      const staffRecord = await Staff.findOne({ userId: user.id });
      if (!staffRecord) return message.reply(":x: That user is not in the staff database.");

      const member = await message.guild.members.fetch(user.id).catch(() => null);
      if (!member) return message.reply(":warning: Could not find that member in this server.");

      const gcfg = cfg?.guildCfg || await GuildConfig.findOne({ guildId: message.guild.id }).lean();
      if (!gcfg?.staffRoles || Object.keys(gcfg.staffRoles).length === 0) {
        return message.reply(":warning: This server has no staff roles configured. Please set them in the dashboard first.");
      }

      const roles = gcfg.staffRoles;
      const baseId = gcfg.baseStaffRole || roles.base;
      const ids = {
        trial: roles.trialMod,
        mod: roles.mod,
        sr: roles.seniorMod,
        retired: roles.retired,
        mgmt: roles.management
      };

      const has = id => id && member.roles.cache.has(id);
      const add = async id => id && await member.roles.add(id).catch(() => {});
      const rem = async id => id && member.roles.cache.has(id) && await member.roles.remove(id).catch(() => {});

      let current;
      if (has(ids.mgmt)) current = "mgmt";
      else if (has(ids.retired)) current = "retired";
      else if (has(ids.sr)) current = "sr";
      else if (has(ids.mod)) current = "mod";
      else if (has(ids.trial)) current = "trial";
      else return message.reply(":warning: This user does not have a recognized staff rank.");

      let newRankName = "";
      switch (current) {
        case "mgmt":    await rem(ids.mgmt);    await add(ids.retired); if (baseId) await rem(baseId); newRankName = "Retired"; break;
        case "retired": await rem(ids.retired); await add(ids.sr);      if (baseId) await add(baseId); newRankName = "Senior Mod"; break;
        case "sr":      await rem(ids.sr);      await add(ids.mod);     newRankName = "Mod"; break;
        case "mod":     await rem(ids.mod);     await add(ids.trial);   newRankName = "Trial Mod"; break;
        case "trial":   return message.reply(":warning: Cannot demote below Trial Mod. Use removeStaff to remove them from staff.");
      }

      staffRecord.currentRank = newRankName;
      await staffRecord.save();

      const details =
        `**User Demoted:** ${user.tag} (<@${user.id}>)\n` +
        `**Demoted By:** ${message.author.tag} (<@${message.author.id}>)\n` +
        `**New Rank:** ${newRankName}\n` +
        `**Date & Time:** <t:${Math.floor(Date.now() / 1000)}:F>`;

      await logAction(client, "promotions", `⬇️ **Staff Demoted**\n${details}`, message);
      return message.reply(`✅ ${user.tag} has been demoted to ${newRankName}.`);
    } catch (err) {
      console.error("Demote command error:", err);
      await errorLogger(client, "demote", err, message);
      throw err;
    }
  }
};