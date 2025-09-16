// commands/balance.js
const Balance = require("../models/Balance");

module.exports = {
  name: "balance",
  description: "Check a user’s Plutus balance. Usage: !balance [@user|ID|myid]",
  async execute(message, args) {
    // Allow "myid" shortcut
    let targetId;
    if (!args[0] || args[0].toLowerCase() === "myid") {
      targetId = message.author.id;
    } else if (message.mentions.users.first()) {
      targetId = message.mentions.users.first().id;
    } else {
      targetId = args[0];
    }

    const user = await message.client.users.fetch(targetId).catch(() => null);
    if (!user) return message.reply("⚠️ Invalid user.");

    let bal = await Balance.findOne({ userId: user.id });
    if (!bal) bal = await Balance.create({ userId: user.id, balance: 0 });

    return message.reply(`💰 **${user.tag}** has **${bal.balance} Plutus**.`);
  },
};