// commands/purgerole.js
const RoleOwnership = require('../models/RoleOwnership');
const Balance = require('../models/PlutusBalance');
const logAction = require('../utils/logger');

module.exports = {
  name: 'purgerole',
  description: 'Purge a custom role by its code name (cost: 5 Plutus)',
  async execute(message, args) {
    const code = args[0];
    if (!code) {
      return message.reply('⚠️ Usage: `!purgerole <codeName>`');
    }

    // ── Find role ownership by code ──
    const ownership = await RoleOwnership.findOne({
      guildId: message.guild.id,
      code: code.toLowerCase()
    });
    if (!ownership) {
      return message.reply(`❌ No ownership found for code \`${code}\`.`);
    }
    if (ownership.ownerId !== message.author.id) {
      return message.reply('❌ Only the role owner can purge this role.');
    }

    // ── Economy check ──
    const cost = 5; // Plutus cost
    let wallet = await Balance.findOne({ userId: message.author.id });
    if (!wallet) wallet = await Balance.create({ userId: message.author.id, balance: 0 });

    if (wallet.balance < cost) {
      return message.reply(`❌ You need **${cost} Plutus** to purge this role. Current balance: ${wallet.balance}`);
    }

    // ── Get the Discord role ──
    const role = message.guild.roles.cache.get(ownership.roleId);
    if (!role) {
      return message.reply('⚠️ The Discord role tied to this code no longer exists.');
    }

    // ── Remove the role from everyone except the owner ──
    let removed = 0;
    for (const member of role.members.values()) {
      if (member.id !== ownership.ownerId) {
        await member.roles.remove(role).catch(() => {});
        removed++;
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
      'ownership',
      `🧹 **Role Purged**`,
      `**Code:** ${code}\n**Role:** ${role.name}\n**By:** ${message.author.tag}\n**Cost:** ${cost} Plutus`
    );

    return message.reply(
      `✅ Purged **${removed}** member(s) from **${role.name}**.\n` +
      `💰 **${cost} Plutus** has been deducted from your balance.\n` +
      `Use \`!claimrole ${code}\` to reclaim ownership if desired.`
    );
  }
};