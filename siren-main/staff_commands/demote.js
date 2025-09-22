const Staff = require("../models/Staff");
const GuildConfig = require("../models/GuildConfig");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "demote",
  description: "Demote a staff member following the rank hierarchy",
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
      if (!gcfg?.staffRoles) {
        return message.reply(":warning: Please configure staff roles in the dashboard first.");
      }

      const roles = gcfg.staffRoles; // object with keys
      const baseId   = gcfg.baseStaffRole;
      const trialId  = roles.trialMod;
      const modId    = roles.mod;
      const srId     = roles.seniorMod;
      const retiredId= roles.retired;
      const mgmtId   = roles.management;

      // Determine current rank from member’s roles
      const has = id => id && member.roles.cache.has(id);
      let current;
      if (has(mgmtId)) current = "management";
      else if (has(retiredId)) current = "retired";
      else if (has(srId)) current = "seniorMod";
      else if (has(modId)) current = "mod";
      else if (has(trialId)) current = "trialMod";
      else return message.reply(":warning: This user does not have a recognized staff rank.");

      // Trial Mod cannot be demoted further
      if (current === "trialMod") {
        return message.reply(":warning: A user cannot be demoted below Trial Mod. Remove them from staff instead.");
      }

      // Utility to safely add/remove a role
      const addRole = async id => id && await member.roles.add(id).catch(() => {});
      const removeRole = async id => id && member.roles.cache.has(id) && await member.roles.remove(id).catch(() => {});

      // Perform the correct demotion
      switch (current) {
        case "management":
          await removeRole(mgmtId);
          await addRole(retiredId);
          // base staff stays removed
          break;
        case "retired":
          await removeRole(retiredId);
          await addRole(srId);
          await addRole(baseId);
          break;
        case "seniorMod":
          await removeRole(srId);
          await addRole(modId);
          // base staff remains
          break;
        case "mod":
          await removeRole(modId);
          await addRole(trialId);
          // base staff remains
          break;
      }

      // Update staff record rank index to match new role
      const rankMap = ["trialMod","mod","seniorMod","retired","management"];
      const newRank = current === "management"
        ? rankMap.indexOf("retired")
        : current === "retired"
          ? rankMap.indexOf("seniorMod")
          : current === "seniorMod"
            ? rankMap.indexOf("mod")
            : rankMap.indexOf("trialMod");
      staffRecord.currentRank = newRank;
      await staffRecord.save();

      const details =
        `**User Demoted:** ${user.tag} (<@${user.id}>)\n` +
        `**Demoted By:** ${message.author.tag} (<@${message.author.id}>)\n` +
        `**New Rank:** ${rankMap[newRank]}\n` +
        `**Date & Time:** <t:${Math.floor(Date.now() / 1000)}:F>`;

      await logAction(client, "promotions", `⬇️ **Staff Demoted**\n${details}`, message);
      return message.reply(`✅ ${user.tag} has been demoted to ${rankMap[newRank]}.`);
    } catch (err) {
      console.error("Demote command error:", err);
      await errorLogger(client, "demote", err, message);
      throw err;
    }
  }
};