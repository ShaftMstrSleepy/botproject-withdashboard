const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");
const errorLogger = require("../utils/errorLogger");
const logAction = require("../utils/logger");
const GuildConfig = require("../models/GuildConfig");

module.exports = {
  name: "unban",
  description: "Unban a user and DM them an invite link back to the server",
  usage: "!unban <userID> [reason]",
  async execute(message, args, _cfg, client) {
    try {
      const gcfg = await GuildConfig.findOne({ guildId: message.guild.id }).lean();

      // 🔹 NEW
      const cmdCfg = gcfg?.commandSettings?.get?.("unban") || gcfg?.commandSettings?.unban;
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
      // 🔹 END

      // Only the Bot Owner or Management can use this command
      const ownerId = config.ownerId;
      const managementRoleId = "1232894786684588062";

      const isOwner = message.author.id === ownerId;
      const isManagement = message.member.roles.cache.has(managementRoleId);

      if (!isOwner && !isManagement) {
        return message.reply("❌ You do not have permission to use this command.");
      }

      const userId = args[0];
      if (!userId) {
        return message.reply(
          "⚠️ Please provide the user ID to unban.\nExample: `!unban 123456789012345678 Optional reason`"
        );
      }
      const reason = args.slice(1).join(" ") || "No reason provided";

      const bans = await message.guild.bans.fetch();
      const bannedUser = bans.get(userId);
      if (!bannedUser) {
        return message.reply("⚠️ That user is not currently banned.");
      }

      await message.guild.bans.remove(userId, reason);

      const invite = await message.channel.createInvite({
        maxAge: 86400,
        maxUses: 1,
        unique: true
      }).catch(() => null);

      if (invite) {
        try {
          const user = await client.users.fetch(userId);
          await user.send(
            `✅ You have been **unbanned** from **${message.guild.name}**.\n` +
            `Reason: ${reason}\n` +
            `Here is a one-time invite to rejoin: ${invite.url}`
          );
        } catch (e) {
          await errorLogger(client, "unban-dm", e);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle("🟢 User Unbanned")
        .setColor("Green")
        .setDescription(
          `**User Unbanned:** <@${userId}> (${userId})\n` +
          `**Unbanned By:** ${message.author.tag} (<@${message.author.id}>)\n` +
          `**Reason:** ${reason}\n` +
          `**Date & Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
        )
        .setTimestamp();

      const logChannelId = config.logChannels.punishments;
      const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }

      return message.reply(`✅ Successfully unbanned <@${userId}> and sent them an invite link.`);
    } catch (err) {
      console.error("Unban command error:", err);
      await errorLogger(client, "unban", err);
      return message.reply("❌ There was an error while trying to unban that user.");
    }
  }
};