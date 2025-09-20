// commands/addrlowner.js
const CustomRole = require("../models/CustomRole");
const config = require("../config");

module.exports = {
  name: "addrlowner",
  description: "Owner/Management: Assign a specific user ID as the allowed owner of a custom role code.",
  async execute(message, args) {
    if (
      message.author.id !== config.ownerId &&
      !message.member.roles.cache.has("1232894786684588062")
    ) {
      return message.reply("❌ Only the Owner or Management can use this command.");
    }

    const code = args[0]?.toLowerCase();
    const userId = args[1];
    if (!code || !userId) {
      return message.reply("⚠️ Usage: `!addrlowner <codeName> <userID>`");
    }

    const role = await CustomRole.findOne({ codeName: code });
    if (!role) {
      return message.reply(`❌ No custom role found for code \`${code}\`.`);
    }

    role.ownerId = userId;
    await role.save();

    return message.reply(`✅ User <@${userId}> is now set as the owner of role code \`${code}\`.`);
  }
};