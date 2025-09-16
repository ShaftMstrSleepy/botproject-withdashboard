const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");
const errorLogger = require("../utils/errorLogger");
const logAction = require("../utils/logger");

module.exports = {
  name: "unban",
  description: "Unban a user and DM them an invite link back to the server",
  usage: "!unban <userID> [reason]",
  async execute(message, args, _cfg, client) {
    try {
      // ----- Permissions -----
      // Only the Bot Owner or Management can use this command
      const ownerId = config.ownerId;                     // Your ID from config
      const managementRoleId = "1232894786684588062";     // Management role ID

      const isOwner = message.author.id === ownerId;
      const isManagement = message.member.roles.cache.has(managementRoleId);

      if (!isOwner && !isManagement) {
        return message.reply("❌ You do not have permission to use this command.");
      }

      // ----- Arguments -----
      const userId = args[0];
      if (!userId) {
        return message.reply(
          "⚠️ Please provide the user ID to unban.\nExample: `!unban 123456789012345678 Optional reason`"
        );
      }
      const reason = args.slice(1).join(" ") || "No reason provided";

      // ----- Check Ban List -----
      const bans = await message.guild.bans.fetch();
      const bannedUser = bans.get(userId);
      if (!bannedUser) {
        return message.reply("⚠️ That user is not currently banned.");
      }

      // ----- Unban -----
      await message.guild.bans.remove(userId, reason);

      // ----- DM the user with a one-time invite -----
      const invite = await message.channel.createInvite({
        maxAge: 86400, // 24 hours
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

      // ----- Log the Action -----
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