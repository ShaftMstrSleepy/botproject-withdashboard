const RoleOwnership = require('../models/RoleOwnership');
const logAction = require('../utils/logger');

module.exports = {
  name: 'addcoowner',
  description: 'Add co-owner: !addcoowner <roleId> <userId>',
  async execute(message, args) {
    const roleId = args[0];
    const userId = args[1];
    if (!roleId || !userId) return message.reply('⚠️ Usage: !addcoowner <roleId> <userId>');

    const role = message.guild.roles.cache.get(roleId);
    if (!role) return message.reply('⚠️ Invalid role ID.');

    const ownership = await RoleOwnership.findOne({ guildId: message.guild.id, roleId, userId: message.author.id });
    if (!ownership) return message.reply('❌ No ownership found for this role.');

    if (ownership.ownerId !== message.author.id) return message.reply('❌ Only the owner can add co-owners.');

    const user = await message.client.users.fetch(userId).catch(()=>null);
    if (!user) return message.reply('⚠️ Invalid user ID.');

    if (!ownership.coOwners.includes(user.id)) {
      ownership.coOwners.push(user.id);
      await ownership.save();
      await logAction(message.client, 'ownership', '➕ Co-owner Added', `**Role:** ${role.name}\n**Co-owner:** ${user.tag}\n**By:** ${message.author.tag}`);
    }
    return message.reply(`✅ ${user.tag} added as co-owner of ${role.name}.`);
  }
};