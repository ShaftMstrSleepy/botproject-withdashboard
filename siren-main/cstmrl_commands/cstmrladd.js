const CustomRole = require("../models/CustomRole");
const logAction = require("../utils/logger");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "cstmrladd",
  description: "!cstmrladd <codeName> <@user|userID> – Add a co-owner",
  async execute(message, args) {
    try {
      const code = args[0]?.toLowerCase();
      const target =
        message.mentions.users.first() ||
        (args[1] && await message.client.users.fetch(args[1]).catch(()=>null));
      if (!code || !target) return message.reply("⚠️ Usage: !cstmrladd <codeName> <user>");

      const record = await CustomRole.findOne({ userId: message.author.id, guildId: message.guild.id, codeName: code });
      if (!record) return message.reply("❌ No role found for that code.");
      if (record.ownerId !== message.author.id)
        return message.reply("❌ Only the owner can add co-owners.");

      if (!record.coOwners.includes(target.id)) {
        record.coOwners.push(target.id);
        await record.save();
      }

      const details =
        `**Owner:** ${message.author.tag} (<@${message.author.id}>)\n` +
        `**Co-Owner Added:** ${target.tag} (<@${target.id}>)\n` +
        `**Code:** ${code}\n` +
        `**Date & Time:** <t:${Math.floor(Date.now()/1000)}:F>`;

      await logAction(message.client,"ownership",`🤝 **Co-Owner Added**\n${details}`);
      return message.reply(`✅ ${target.tag} is now a co-owner for role code **${code}**.`);
    } catch (err) {
      console.error("cstmrladd error:", err);
      await errorLogger(message.client, "cstmrladd", err);
    }
  }
};