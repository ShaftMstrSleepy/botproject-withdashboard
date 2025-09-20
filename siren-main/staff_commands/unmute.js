const getMember = require('../utils/getMember');
const GuildConfig = require('../models/GuildConfig');
const logAction = require('../utils/logger');

module.exports = {
  name: 'unmute',
  description: 'Remove the muted role from a user: !unmute <@user|userId>',
  async execute(message, args, cfg) {
    try {
      if (!message.guild) return;
      if (!message.member.permissions.has('ManageRoles')) {
        return message.reply('❌ You do not have permission to unmute users.');
      }

      const target = await getMember(message, args[0]);
      if (!target) return message.reply('⚠️ Please mention a user or provide a valid user ID.');

      const gcfg = cfg?.guildCfg || await GuildConfig.findOne({ guildId: message.guild.id }).lean();
      const mutedRoleId = gcfg?.mutedRoleId;
      const mutedRole = mutedRoleId ? message.guild.roles.cache.get(mutedRoleId) : null;
      if (!mutedRole) return message.reply('❌ Muted role not configured in the dashboard.');

      if (!target.roles.cache.has(mutedRole.id)) {
        return message.reply(`ℹ️ ${target.user.tag} is not currently muted.`);
      }

      await target.roles.remove(mutedRole, `Unmuted by ${message.author.tag}`);

      await logAction(
        message.client,
        'punishments',
        `🔊 **User Unmuted**\n**User:** ${target.user.tag} (${target.id})\n**By:** ${message.author.tag}`,
        message
      );

      return message.reply(`✅ ${target.user.tag} has been unmuted.`);
    } catch (err) {
      console.error('unmute error:', err);
      return message.reply(
        '❌ I could not remove the muted role. Ensure I have **Manage Roles** and my role is **above** the Muted role.'
      );
    }
  }
};