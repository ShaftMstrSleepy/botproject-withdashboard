const config = require("../config.json");

module.exports = {
  name: "restart",
  description: "Owner only: Restart the bot process",
  async execute(message) {
    const ownerIds = ["1143711364947390566"]; // your Discord user ID
    if (!ownerIds.includes(message.author.id)) {
      return message.reply("❌ You do not have permission to restart the bot.");
    }

    // Save the channel where the command was run, so we can notify it on startup
    message.client.restartChannelId = message.channel.id;

    await message.reply("🔄 Restarting bot...");
    console.log(`Bot restart triggered by ${message.author.tag}`);
    process.exit(0); // PM2 or your host should restart it
  }
};