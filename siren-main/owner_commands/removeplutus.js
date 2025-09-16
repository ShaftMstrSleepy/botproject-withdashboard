const Balance = require("../models/Balance");
const logAction = require("../utils/logger");
const isOwner = require("../utils/ownerGuard");

module.exports = {
  name: "removeplutus",
  description: "Owner only: Remove Plutus from a user",
  async execute(message, args) {
    if (!isOwner(message.author.id)) {
      return message.reply("❌ This command is owner-only.");
    }

    if (!args[0] || !args[1]) return message.reply("Usage: `!removeplutus @User 25`");

    const targetId = message.mentions.users.first()?.id || args[0];
    const amount = parseInt(args[1], 10);
    if (isNaN(amount)) return message.reply("Usage: `!removeplutus @User 25`");

    const user = await message.client.users.fetch(targetId).catch(() => null);
    if (!user) return message.reply("⚠️ Invalid user.");

    const bal = await Balance.findOneAndUpdate(
      { userId: user.id },
      { $inc: { balance: -amount } },
      { new: true, upsert: true }
    );

    if (bal.balance < 0) { bal.balance = 0; await bal.save(); }

    await logAction(
      message.client,
      "general",
      `💸 **Plutus Removed**\n**User:** ${user.tag} (<@${user.id}>)\n**Amount:** ${amount}\n**By:** ${message.author.tag}`
    );

    return message.reply(`✅ Removed **${amount} Plutus** from **${user.tag}**. New total: **${bal.balance}**.`);
  },
};