const isOwner = require("../utils/ownerGuard");
const PlutusBalance = require("../models/PlutusBalance");
const GuildConfig = require("../models/GuildConfig");

module.exports = {
  name: "addcstmrl",
  description: "Owner/Server-Owner add a custom role (costs 10 Plutus)",
  async execute(message, args) {
    try {
      if (!message.guild) return;
      const guildCfg = await GuildConfig.findOne({ guildId: message.guild.id });
      const member = message.member;

      // Allow bot owner or server owner
      const isServerOwner = message.guild.ownerId === message.author.id;
      if (!isOwner(message.author.id) && !isServerOwner) {
        return message.reply("❌ Only the bot owner or this server’s owner can use this command.");
      }

      if (args.length < 3)
        return message.reply("Usage: !addcstmrl <user|id|myid> <roleId> <codeName>");

      const targetUser = args[0] === "myid"
        ? message.author
        : (message.mentions.users.first()
            || await message.client.users.fetch(args[0]).catch(() => null));
      if (!targetUser) return message.reply("❌ Could not find that user.");

      const roleId = args[1];
      const codeName = args.slice(2).join(" ");

      // deduct 10 Plutus from executor
      let bal = await PlutusBalance.findOne({ userId: message.author.id });
      if (!bal || bal.balance < 10)
        return message.reply("❌ You need at least 10 Plutus to run this command.");
      bal.balance -= 10;
      await bal.save();

      // record ownership in GuildConfig.customRoles
      guildCfg.customRoles.push({
        name: codeName,
        roleId,
        price: 0,
        enabled: true
      });
      await guildCfg.save();

      message.reply(`✅ Custom role **${codeName}** (${roleId}) assigned to <@${targetUser.id}> and stored.`);
    } catch (err) {
      console.error("addcstmrl error:", err);
      message.reply("❌ Failed to add custom role.");
    }
  }
};