const Staff = require("../models/Staff");
const GuildConfig = require("../models/GuildConfig");
const logAction = require("../utils/logger");

module.exports = {
  name: "setrank",
  description: "Set a staff member's rank. Usage: !setrank @user <index>",
  async execute(message, args, cfg) {
    if (!message.member.permissions.has("ManageRoles")) {
      return message.reply("❌ Only Management can use this command.");
    }

    const user = message.mentions.users.first()
      || await message.client.users.fetch(args[0]).catch(() => null);
    const rankIndex = Number(args[1]);
    if (!user || Number.isNaN(rankIndex)) {
      return message.reply("⚠️ Usage: `!setrank @user <rankIndex>`");
    }

    const gcfg = cfg?.guildCfg || await GuildConfig.findOne({ guildId: message.guild.id }).lean();
    const ladder = gcfg?.staffRoles || [];
    if (!ladder.length || rankIndex < 0 || rankIndex >= ladder.length) {
      return message.reply("⚠️ Invalid rank index or staffRoles not configured.");
    }

    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return message.reply("⚠️ Member not found.");

    // Remove all staff roles, then add the chosen one
    for (const rid of ladder) {
      if (member.roles.cache.has(rid)) await member.roles.remove(rid).catch(() => {});
    }
    const newRoleId = ladder[rankIndex];
    await member.roles.add(newRoleId).catch(() => {});

    // Keep/update DB record
    await Staff.findOneAndUpdate(
      { userId: user.id },
      { currentRank: rankIndex },
      { upsert: true }
    );

    await logAction(
      message.client,
      "promotions",
      `🎚️ Rank Set\n**User:** <@${user.id}>\n**Rank Index:** ${rankIndex}\n**By:** ${message.author.tag}`,
      message
    );

    message.reply(`✅ Set rank of ${user.tag} to index **${rankIndex}**.`);
  }
};