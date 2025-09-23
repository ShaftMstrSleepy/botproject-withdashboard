const { v4: uuidv4 } = require("uuid");
const Punishment = require("../models/Punishment");
const GuildConfig = require("../models/GuildConfig");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");
const { hasRequiredRank } = require("../utils/hasRank");

module.exports = {
  name: "mute",
  description: "Mute a user (Trial Mod or higher).",
  async execute(message, args, cfg) {
    try {
      const gcfg = cfg?.guildCfg || await GuildConfig.findOne({ guildId: message.guild.id }).lean();

      // 🔹 NEW: Per-command toggle & role-restriction check
      const cmdCfg = gcfg?.commandSettings?.get?.("mute") || gcfg?.commandSettings?.mute;
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

      if (!hasRequiredRank(message.member, 0, gcfg)) {
        return message.reply("❌ You must be **Trial Mod or higher** to mute users.");
      }

      const user =
        message.mentions.users.first() ||
        (args[0] && await message.client.users.fetch(args[0]).catch(() => null));
      if (!user) return message.reply("⚠️ Mention a user or provide their ID.");

      const member = await message.guild.members.fetch(user.id).catch(() => null);
      if (!member) return message.reply("⚠️ Member not found in this server.");

      const muteRoleId = gcfg?.mutedRoleId;
      const muteRole = muteRoleId ? message.guild.roles.cache.get(muteRoleId) : null;
      if (!muteRole) return message.reply("❌ Muted role is not configured in the dashboard.");
      if (member.roles.cache.has(muteRole.id))
        return message.reply("⚠️ User is already muted.");

      const reason = args.slice(1).join(" ") || "No reason provided";
      await member.roles.add(muteRole);

      const caseId = uuidv4();
      await Punishment.create({
        userId: user.id,
        moderatorId: message.author.id,
        type: "mute",
        reason,
        caseId,
        timestamp: Date.now(),
        active: true
      });

      await logAction(
        message.client,
        "punishments",
        `🔇 **User Muted**\n**User:** ${user.tag} (<@${user.id}>)\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}\n**Case ID:** ${caseId}`,
        message
      );

      return message.reply(`✅ Muted ${user.tag}. Case ID: \`${caseId}\``);
    } catch (err) {
      console.error(err);
      await errorLogger(message.client, "mute", err, message);
      return message.reply("❌ Failed to mute the user.");
    }
  }
};