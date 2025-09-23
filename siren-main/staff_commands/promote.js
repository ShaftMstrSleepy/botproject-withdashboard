const Staff = require("../models/Staff");
const GuildConfig = require("../models/GuildConfig");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "promote",
  description: "Promote a staff member through the guild’s configured staff roles",
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

      const gcfg = cfg?.guildCfg || await GuildConfig.findOne({ guildId: message.guild.id }).lean();
      if (!gcfg?.staffRoles) {
        return message.reply(":warning: This server has no staffRoles configured. Please set them in the dashboard.");
      }

      const roles    = gcfg.staffRoles;
      const baseId   = gcfg.baseStaffRole;
      const trialId  = roles.trialMod;
      const modId    = roles.mod;
      const srId     = roles.seniorMod;
      const retiredId= roles.retired;
      const mgmtId   = roles.management;

      const has = id => id && member.roles.cache.has(id);
      let current;
      if (has(trialId)) current = "trialMod";
      else if (has(modId)) current = "mod";
      else if (has(srId)) current = "seniorMod";
      else if (has(retiredId)) current = "retired";
      else if (has(mgmtId)) current = "management";
      else return message.reply(":warning: This user does not have a recognized staff rank.");

      const addRole    = async id => id && await member.roles.add(id).catch(() => {});
      const removeRole = async id => id && member.roles.cache.has(id) && await member.roles.remove(id).catch(() => {});

      let newRankName = "";
      switch (current) {
        case "trialMod":
          await removeRole(trialId);
          await addRole(modId);
          newRankName = "Mod";
          break;
        case "mod":
          await removeRole(modId);
          await addRole(srId);
          newRankName = "Senior Mod";
          break;
        case "seniorMod":
          await removeRole(srId);
          await addRole(retiredId);
          if (baseId) await removeRole(baseId);           // ✅ Remove base staff when reaching Retired
          newRankName = "Retired";
          break;
        case "retired":
          await removeRole(retiredId);
          await addRole(mgmtId);
          if (baseId) await removeRole(baseId);           // ✅ Keep base staff off for Management
          newRankName = "Management";
          break;
        default:
          return message.reply(":warning: This user is already at the highest rank.");
      }

      const rankMap = ["trialMod", "mod", "seniorMod", "retired", "management"];
      staffRecord.currentRank = rankMap.indexOf(newRankName.toLowerCase());
      await staffRecord.save();

      const details =
        `**User Promoted:** ${user.tag} (<@${user.id}>)\n` +
        `**Promoted By:** ${message.author.tag} (<@${message.author.id}>)\n` +
        `**New Rank:** ${newRankName}\n` +
        `**Date & Time:** <t:${Math.floor(Date.now() / 1000)}:F>`;

      await logAction(client, "promotions", `⬆️ **Staff Promoted**\n${details}`, message);
      return message.reply(`✅ ${user.tag} has been promoted to ${newRankName}.`);
    } catch (err) {
      console.error("Promote command error:", err);
      await errorLogger(client, "promote", err, message);
      throw err;
    }
  }
};