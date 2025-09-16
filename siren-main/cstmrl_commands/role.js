const CustomRole = require("../models/CustomRole");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "role",
  description: "!role <codeName> <@user|userID> – Give/take the role you own or co-own",
  async execute(message, args) {
    try {
      const code = args[0]?.toLowerCase();
      const target =
        message.mentions.users.first() ||
        (args[1] && await message.client.users.fetch(args[1]).catch(()=>null));
      if (!code || !target)
        return message.reply("⚠️ Usage: !role <codeName> <@user|userID>");

      const record = await CustomRole.findOne({ codeName: code });
      if (!record) return message.reply("❌ No role found for that code.");

      if (
        message.author.id !== record.ownerId &&
        !record.coOwners.includes(message.author.id)
      ) {
        return message.reply("❌ Only the owner or a co-owner can manage this role.");
      }

      const role = await message.guild.roles.fetch(record.roleId).catch(()=>null);
      if (!role) return message.reply("❌ Role not found.");

      const member = await message.guild.members.fetch(target.id);
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        return message.reply(`➖ Removed **${role.name}** from ${target.tag}`);
      } else {
        await member.roles.add(role);
        return message.reply(`➕ Granted **${role.name}** to ${target.tag}`);
      }
    } catch (err) {
      console.error("role cmd error:", err);
      await errorLogger(message.client, "role", err);
    }
  }
};