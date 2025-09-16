// commands/removeplutus.js
const Balance = require("../models/Balance");
const config = require("../config.json");
const logAction = require("../utils/logger");

module.exports = {
  name: "removeplutus",
  description: "Owner/Management: Remove Plutus from a user",
  async execute(message, args) {
    if (
      message.author.id !== config.ownerId &&
      !message.member.roles.cache.has("1232894786684588062")
    ) {
      return message.reply("❌ Only the Owner or Management can remove Plutus.");
    }

    let targetId;
    if (!args[0]) return message.reply("Usage: `!removeplutus @User 25`");
    if (args[0].toLowerCase() === "myid") targetId = message.author.id;
    else if (message.mentions.users.first()) targetId = message.mentions.users.first().id;
    else targetId = args[0];

    const amount = parseInt(args[1], 10);
    if (isNaN(amount)) return message.reply("Usage: `!removeplutus @User 25`");

    const user = await message.client.users.fetch(targetId).catch(() => null);
    if (!user) return message.reply("⚠️ Invalid user.");

    const bal = await Balance.findOneAndUpdate(
      { userId: user.id },
      { $inc: { balance: -amount } },
      { new: true, upsert: true }
    );

    // Prevent negatives
    if (bal.balance < 0) {
      bal.balance = 0;
      await bal.save();
    }

    await logAction(
      message.client,
      "general",
      `💸 **Plutus Removed**\n**User:** ${user.tag} (<@${user.id}>)\n**Amount:** ${amount}\n**By:** ${message.author.tag}`
    );

    return message.reply(
      `✅ Removed **${amount} Plutus** from **${user.tag}**. New total: **${bal.balance}**.`
    );
  },
};