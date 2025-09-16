// commands/unmute.js
const getMember = require('../utils/getMember');
const logAction = require('../utils/logger');

module.exports = {
  name: 'unmute',
  description: 'Remove the muted role from a user: !unmute <@user|userId>',
  async execute(message, args, config) {
    try {
      // Only in guilds
      if (!message.guild) return;

      // Permission: ManageRoles is the most relevant for adding/removing roles
      if (!message.member.permissions.has('ManageRoles')) {
        return message.reply('❌ You do not have permission to unmute users.');
      }

      // Resolve member from mention or ID
      const target = await getMember(message, args[0]);
      if (!target) {
        return message.reply('⚠️ Please mention a user or provide a valid user ID.');
      }

      // Resolve Muted role from config
      const mutedRoleId = config.mutedRoleId;
      const mutedRole = mutedRoleId ? message.guild.roles.cache.get(mutedRoleId) : null;
      if (!mutedRole) {
        return message.reply('❌ Muted role not found. Please set `mutedRoleId` in config.json and ensure the role exists.');
      }

      // Check if user is actually muted
      if (!target.roles.cache.has(mutedRole.id)) {
        return message.reply(`ℹ️ ${target.user.tag} is not currently muted.`);
      }

      // Try to remove the role
      await target.roles.remove(mutedRole, `Unmuted by ${message.author.tag}`);

      // Log & confirm
      await logAction(
        message.client,
        'punishments',
        '🔊 User Unmuted',
        `**User:** ${target.user.tag} (${target.id})\n**By:** ${message.author.tag}`
      );

      return message.reply(`✅ ${target.user.tag} has been unmuted.`);
    } catch (err) {
      console.error('unmute error:', err);
      // Common cause: role hierarchy or missing Manage Roles
      return message.reply(
        '❌ I could not remove the muted role. Make sure I have **Manage Roles** and my role is **above** the Muted role.'
      );
    }
  }
};