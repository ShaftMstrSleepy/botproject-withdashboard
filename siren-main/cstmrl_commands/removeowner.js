// commands/removeowner.js
const CustomRole = require("../models/CustomRole");
const config = require("../config");

module.exports = {
  name: "removeowner",
  description: "Owner/Management: Remove the current owner of a custom role code so it becomes unowned.",
  async execute(message, args) {
    // Restrict to Owner or Management role
    if (
      message.author.id !== config.ownerId &&
      !message.member.roles.cache.has("1232894786684588062")
    ) {
      return message.reply("❌ Only the Owner or Management can use this command.");
    }

    const code = args[0]?.toLowerCase();
    if (!code) {
      return message.reply("⚠️ Usage: `!removeowner <codeName>`");
    }

    const role = await CustomRole.findOne({ userId: message.author.id, guildId: message.guild.id, codeName: code });
    if (!role) {
      return message.reply(`❌ No custom role found for code \`${code}\`.`);
    }

    role.ownerId = "";
    role.coOwners = [];
    await role.save();

    return message.reply(`✅ Ownership removed for custom role code \`${code}\`. It is now unowned.`);
  }
};