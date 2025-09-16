const CustomRole = require("../models/CustomRole");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "transferrole",
  description: "!transferrole <codeName> <@newOwner|userID> – Transfer full ownership of a custom role",
  async execute(message, args) {
    try {
      const code = args[0]?.toLowerCase();
      const newOwner =
        message.mentions.users.first() ||
        (args[1] && await message.client.users.fetch(args[1]).catch(()=>null));
      if (!code || !newOwner)
        return message.reply("⚠️ Usage: !transferrole <codeName> <@user|userID>");

      // Look up the role in DB by codeName
      const record = await CustomRole.findOne({ codeName: code });
      if (!record) return message.reply("❌ No custom role found for that code.");

      // Only the current owner can transfer
      if (record.ownerId !== message.author.id)
        return message.reply("❌ Only the current owner can transfer this role.");

      const guildRole = await message.guild.roles.fetch(record.roleId).catch(()=>null);
      if (!guildRole)
        return message.reply("❌ The stored role ID is invalid or the role was deleted.");

      // Update DB with the new owner
      record.ownerId = newOwner.id;
      await record.save();

      // Add the role to new owner if they don’t have it
      const member = await message.guild.members.fetch(newOwner.id);
      if (!member.roles.cache.has(guildRole.id)) {
        await member.roles.add(guildRole);
      }

      // Remove role from old owner if they still have it
      const oldMember = await message.guild.members.fetch(message.author.id);
      if (oldMember.roles.cache.has(guildRole.id)) {
        await oldMember.roles.remove(guildRole);
      }

      // Log to ownership channel
      const details =
        `**Old Owner:** ${message.author.tag} (<@${message.author.id}>)\n` +
        `**New Owner:** ${newOwner.tag} (<@${newOwner.id}>)\n` +
        `**Role:** ${guildRole.name}\n` +
        `**Code:** ${code}\n` +
        `**Date & Time:** <t:${Math.floor(Date.now()/1000)}:F>`;

      await logAction(message.client, "ownership", `🔄 **Role Ownership Transferred**\n${details}`);

      return message.reply(`✅ Ownership of **${guildRole.name}** has been transferred to ${newOwner.tag}.`);
    } catch (err) {
      console.error("transferrole error:", err);
      await errorLogger(message.client, "transferrole", err);
    }
  }
};