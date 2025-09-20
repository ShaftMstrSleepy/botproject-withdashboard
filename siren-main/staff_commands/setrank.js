const Staff = require("../models/Staff");
const logAction = require("../utils/logger");
const config = require("../config");

module.exports = {
  name: "setrank",
  description: "Set a staff member's rank. Usage: !setrank @user <rank>",
  async execute(message, args) {
    if (
      message.author.id !== config.ownerId &&
      !message.member.roles.cache.has(config.managementRoleId)
    ) {
      return message.reply("❌ Only the Owner or Management can use this command.");
    }

    const user = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
    const rank = args[1];
    if (!user || !rank) return message.reply("⚠️ Usage: `!setrank @user <rank>`");

    await Staff.findOneAndUpdate(
      { userId: user.id },
      { rank },
      { upsert: true }
    );

    await logAction(message.client, "promotions",
      `🎚️ Rank Set\n**User:** <@${user.id}>\n**Rank:** ${rank}\n**By:** ${message.author.tag}`);
    message.reply(`✅ Set rank of ${user.tag} to **${rank}**.`);
  }
};