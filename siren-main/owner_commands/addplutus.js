const Balance = require("../models/PlutusBalance");
const logAction = require("../utils/logger");
const isOwner = require("../utils/ownerGuard");

module.exports = {
  name: "addplutus",
  description: "Owner only: Add Plutus to a user",
  async execute(message, args) {
    if (!isOwner(message.author.id)) {
      return message.reply("❌ Don't be dumb, Owner Only.");
    }

    if (!args[0] || !args[1]) return message.reply("Usage: `!addplutus @User 50`");

    const targetId = message.mentions.users.first()?.id || args[0];
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