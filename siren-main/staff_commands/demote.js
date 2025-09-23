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

      // 🔹 NEW: Per-command toggle & role-restriction check
      const cmdCfg = gcfg?.commandSettings?.get?.("demote") || gcfg?.commandSettings?.demote;
      if (cmdCfg) {
        if (cmdCfg.enabled === false) {
          return message.reply(":no_entry_sign: This command is disabled in the dashboard.");
        }
        if (Array.isArray(cmdCfg.roles) && cmdCfg.roles.length) {
          const allowed = cmdCfg.roles.some(rid => message.member.roles.cache.has(rid));
          if (!allowed) {
            return message.reply(":no_entry_sign: You don’t have permission to use this command.");
          }
        }
      }
      // 🔹 END NEW

      const roles = gcfg?.staffRoles || {};
      const baseId   = gcfg?.baseStaffRole;
      const trialId  = roles.trialMod;
      const modId    = roles.mod;
      const srId     = roles.seniorMod;
      const retiredId= roles.retired;
      const mgmtId   = roles.management;

      const has = id => id && member.roles.cache.has(id);
      let current;
      if (has(mgmtId)) current = "management";
      else if (has(retiredId)) current = "retired";
      else if (has(srId)) current = "seniorMod";
      else if (has(modId)) current = "mod";
      else if (has(trialId)) current = "trialMod";
      else return message.reply(":warning: This user does not have a recognized staff rank.");

      const addRole = async id => id && await member.roles.add(id).catch(() => {});
      const removeRole = async id => id && member.roles.cache.has(id) && await member.roles.remove(id).catch(() => {});

      let newRankName = "";
      switch (current) {
        case "management":
          await removeRole(mgmtId);
          await addRole(retiredId);
          if (baseId) await removeRole(baseId); // ✅ keep base off
          newRankName = "Retired";
          break;
        case "retired":
          await removeRole(retiredId);
          await addRole(srId);
          if (baseId) await addRole(baseId); // ✅ add base back
          newRankName = "Senior Mod";
          break;
        case "seniorMod":
          await removeRole(srId);
          await addRole(modId);
          newRankName = "Mod";
          break;
        case "mod":
          await removeRole(modId);
          await addRole(trialId);
          newRankName = "Trial Mod";
          break;
        case "trialMod":
          return message.reply(":warning: Cannot demote below Trial Mod. Use removeStaff to remove them from staff.");
      }

      const rankMap = ["trialMod", "mod", "seniorMod", "retired", "management"];
      staffRecord.currentRank = rankMap.indexOf(newRankName.toLowerCase());
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