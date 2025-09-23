// ban.js
const { v4: uuidv4 } = require("uuid");
const Punishment = require("../models/Punishment");
const GuildConfig = require("../models/GuildConfig");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");
const { hasRequiredRank } = require("../utils/hasRank");

module.exports = {
  name: "ban",
  description: "Ban a user (Mod or higher).",
  async execute(message, args, cfg) {
    try {
      const gcfg = cfg?.guildCfg || await GuildConfig.findOne({ guildId: message.guild.id }).lean();

      // 🔹 NEW: Per-command toggle & role-restriction check
      const cmdCfg = gcfg?.commandSettings?.get?.("ban") || gcfg?.commandSettings?.ban;
      if (cmdCfg) {
        if (cmdCfg.enabled === false) {
          return message.reply("🚫 This command is disabled in the dashboard.");
        }
        if (Array.isArray(cmdCfg.roles) && cmdCfg.roles.length) {
          const allowed = cmdCfg.roles.some(rid => message.member.roles.cache.has(rid));
          if (!allowed) {
            return message.reply("🚫 You don’t have permission to use this command.");
          }
        }
      }
      // 🔹 END NEW

      if (!hasRequiredRank(message.member, 1, gcfg)) {
        return message.reply(":x: You must be **Mod or higher** to ban users.");
      }

      const user =
        message.mentions.users.first() ||
        (args[0] && await message.client.users.fetch(args[0]).catch(() => null));
      if (!user) return message.reply(":warning: Mention a user or provide their ID.");

      const reason = args.slice(1).join(" ") || "No reason provided";
      const member = await message.guild.members.fetch(user.id).catch(() => null);
      if (!member) return message.reply(":warning: Member not found in this server.");

      await member.ban({ reason });

      const caseId = uuidv4();
      await Punishment.create({
        userId: user.id,
        moderatorId: message.author.id,
        type: "ban",
        reason,
        caseId,
        timestamp: Date.now(),
        active: true
      });

      await logAction(
        message.client,
        "punishments",
        `⛔ **User Banned**\n**User:** ${user.tag} (<@${user.id}>)\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}\n**Case ID:** ${caseId}`,
        message
      );

      return message.reply(`✅ Banned ${user.tag}. Case ID: \`${caseId}\``);
    } catch (err) {
      console.error(err);
      await errorLogger(message.client, "ban", err, message);
      return message.reply(":x: Failed to ban the user.");
    }
  }
};