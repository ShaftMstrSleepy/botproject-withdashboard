// commands/addplutus.js
const Balance = require("../models/Balance");
const config = require("../config.json");
const logAction = require("../utils/logger");

module.exports = {
  name: "addplutus",
  description: "Owner/Management: Add Plutus to a user",
  async execute(message, args) {
    // Permissions: owner or management role
    if (
      message.author.id !== config.ownerId &&
      !message.member.roles.cache.has("1232894786684588062")
    ) {
      return message.reply("❌ Only the Owner or Management can add Plutus.");
    }

    // Resolve target
    let targetId;
    if (!args[0]) return message.reply("Usage: `!addplutus @User 50`");
    if (args[0].toLowerCase() === "myid") targetId = message.author.id;
    else if (message.mentions.users.first()) targetId = message.mentions.users.first().id;
    else targetId = args[0];

    const amount = parseInt(args[1], 10);
    if (isNaN(amount)) return message.reply("Usage: `!addplutus @User 50`");

    const user = await message.client.users.fetch(targetId).catch(() => null);
    if (!user) return message.reply("⚠️ Invalid user.");

    const bal = await Balance.findOneAndUpdate(
      { userId: user.id },
      { $inc: { balance: amount } },
      { new: true, upsert: true }
    );

    await logAction(
      message.client,
      "general",
      `💰 **Plutus Added**\n**User:** ${user.tag} (<@${user.id}>)\n**Amount:** ${amount}\n**By:** ${message.author.tag}`
    );

    return message.reply(`✅ Added **${amount} Plutus** to **${user.tag}**. New total: **${bal.balance}**.`);
  },
};