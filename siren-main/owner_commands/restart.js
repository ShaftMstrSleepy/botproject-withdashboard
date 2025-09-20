const isOwner = require("../utils/ownerGuard");

module.exports = {
  name: "restart",
  description: "Owner only: Restart the bot process",
  async execute(message) {
    if (!isOwner(message.author.id)) {
      return message.reply("❌ No No No Owner Only.");
    }

    message.client.restartChannelId = message.channel.id;
    await message.reply("🔄 Restarting bot...");
    console.log(`Bot restart triggered by ${message.author.tag}`);
    process.exit(0);
  },
};