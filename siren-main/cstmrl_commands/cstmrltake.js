const CustomRole = require("../models/CustomRole");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "cstmrltake",
  description: "!cstmrltake <codeName> <@user|userID> – Remove a co-owner",
  async execute(message, args) {
    try {
      const code = args[0]?.toLowerCase();
      const target =
        message.mentions.users.first() ||
        (args[1] && await message.client.users.fetch(args[1]).catch(()=>null));
      if (!code || !target) return message.reply("⚠️ Usage: !cstmrltake <codeName> <user>");

      const record = await CustomRole.findOne({ userId: message.author.id, guildId: message.guild.id, codeName: code });
      if (!record) return message.reply("❌ No role found for that code.");
      if (record.ownerId !== message.author.id)
        return message.reply("❌ Only the owner can remove co-owners.");

      record.coOwners = record.coOwners.filter(id => id !== target.id);
      await record.save();

      // Remove the role from the user if they had it
      const role = await message.guild.roles.fetch(record.roleId).catch(()=>null);
      if (role) {
        const member = await message.guild.members.fetch(target.id).catch(()=>null);
        if (member && member.roles.cache.has(role.id)) {
          await member.roles.remove(role).catch(()=>{});
        }
      }

      const details =
        `**Owner:** ${message.author.tag} (<@${message.author.id}>)\n` +
        `**Co-Owner Removed:** ${target.tag} (<@${target.id}>)\n` +
        `**Code:** ${code}\n` +
        `**Date & Time:** <t:${Math.floor(Date.now()/1000)}:F>`;

      await logAction(message.client,"ownership",`❌ **Co-Owner Removed**\n${details}`);
      return message.reply(`✅ ${target.tag} is no longer a co-owner for role code **${code}**.`);
    } catch (err) {
      console.error("cstmrltake error:", err);
      await errorLogger(message.client, "cstmrltake", err);
    }
  }
};