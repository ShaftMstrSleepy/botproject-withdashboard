// warn.js
const { v4: uuidv4 } = require("uuid");
const Punishment = require("../models/Punishment");
const GuildConfig = require("../models/GuildConfig");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");
const { hasRequiredRank } = require("../utils/hasRank");

module.exports = {
  name: "warn",
  description: "Warn a user (Trial Mod or higher).",
  async execute(message, args, cfg) {
    try {
      const gcfg = cfg?.guildCfg || await GuildConfig.findOne({ guildId: message.guild.id }).lean();
      if (!hasRequiredRank(message.member, 0, gcfg)) {
        return message.reply("❌ You must be **Trial Mod or higher** to warn users.");
      }

      const user =
        message.mentions.users.first() ||
        (args[0] && await message.client.users.fetch(args[0]).catch(() => null));
      if (!user) return message.reply("⚠️ Mention a user or provide their ID.");

      const reason = args.slice(1).join(" ") || "No reason provided";
      const caseId = uuidv4();

      await Punishment.create({
        userId: user.id,
        moderatorId: message.author.id,
        type: "warn",
        reason,
        caseId,
        timestamp: Date.now(),
        active: true
      });

      await logAction(
        message.client,
        "punishments",
        `⚠️ **User Warned**\n**User:** ${user.tag} (<@${user.id}>)\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}\n**Case ID:** ${caseId}`,
        message
      );

      return message.reply(`✅ Warned ${user.tag}. Case ID: \`${caseId}\``);
    } catch (err) {
      console.error(err);
      await errorLogger(message.client, "warn", err, message);
      return message.reply("❌ Failed to warn the user.");
    }
  }
};