// commands/purgerole.js
const RoleOwnership = require("../models/RoleOwnership");
const Balance = require("../models/PlutusBalance");
const logAction = require("../utils/logger");

module.exports = {
  name: "purgerole",
  aliases: ["purgerl"],
  description: "Purge a custom role by its code name (cost: 5 Plutus)",
  async execute(message, args) {
    const code = args[0]?.toLowerCase();
    if (!code) {
      return message.reply("⚠️ Usage: `!purgerole <codeName>`");
    }

    // ── Locate role ownership by guild + code ──
    const ownership = await RoleOwnership.findOne({
      guildId: message.guild.id,
      userId: message.author.id,
      code
    });
    if (!ownership) {
      return message.reply(`❌ No ownership found for code \`${code}\`.`);
    }
    if (ownership.ownerId !== message.author.id) {
      return message.reply("❌ Only the role owner can purge this role.");
    }

    // ── Economy check ──
    const cost = 5; // cost in Plutus
    let wallet = await Balance.findOne({ userId: message.author.id });
    if (!wallet) wallet = await Balance.create({ userId: message.author.id, balance: 0 });

    if (wallet.balance < cost) {
      return message.reply(`❌ You need **${cost} Plutus** to purge this role. Current balance: ${wallet.balance}`);
    }

    // ── Fetch the actual Discord role ──
    const role = message.guild.roles.cache.get(ownership.roleId);
    if (!role) {
      return message.reply("⚠️ The Discord role tied to this code no longer exists.");
    }

    // ── Remove role from all except the owner ──
    let removedCount = 0;
    for (const member of role.members.values()) {
      if (member.id !== ownership.ownerId) {
        await member.roles.remove(role).catch(() => {});
        removedCount++;
      }
    }

    // ── Deduct cost and save ──
    wallet.balance -= cost;
    await wallet.save();

    // ── Mark as claimable again ──
    ownership.claimPending = true;
    await ownership.save();

    // ── Log action ──
    await logAction(
      message.client,
      "ownership",
      `🧹 **Role Purged**`,
      `**Code:** ${code}\n**Role:** ${role.name}\n**By:** ${message.author.tag}\n**Cost:** ${cost} Plutus`
    );

    return message.reply(
      `✅ Purged **${removedCount}** member(s) from **${role.name}**.\n` +
      `💰 **${cost} Plutus** has been deducted from your balance.\n` +
      `Use \`!claimrole ${code}\` to reclaim ownership if desired.`
    );
  }
};