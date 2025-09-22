const Staff = require('../models/Staff');
const GuildConfig = require('../models/GuildConfig');
const logAction = require('../utils/logger');

module.exports = {
  name: 'addstaff',
  description: 'Add a user as staff: !addstaff <userMention|userId>',
  async execute(message, args, cfg, client) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply(':x: You do not have permission.');
    }

    // 🔎 Load guild config from DB each time
    const gcfg = await GuildConfig.findOne({ guildId: message.guild.id }).lean();
    const baseRoleId = gcfg?.staffRoles?.base;
    if (!baseRoleId) {
      return message.reply(
        '⚠️ A base staff role has not been set in the dashboard for this server. Please configure it before using this command.'
      );
    }

    // Fetch the user argument
    const arg = args[0];
    const user = message.mentions.users.first() ||
      (arg ? await message.client.users.fetch(arg).catch(() => null) : null);
    if (!user) return message.reply(':warning: Please mention a user or provide their ID.');

    // Check for duplicates
    const existing = await Staff.findOne({ userId: user.id, guildId: message.guild.id });
    if (existing) return message.reply(':x: This user is already staff.');

    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return message.reply(':warning: Could not find that member in this server.');

    // ✅ Fetch the actual role object and assign
    const baseRole = message.guild.roles.cache.get(baseRoleId);
    if (!baseRole) {
      return message.reply(
        `⚠️ The base staff role (ID ${baseRoleId}) does not exist or I lack permission to view it.`
      );
    }
    if (!member.roles.cache.has(baseRole.id)) {
      await member.roles.add(baseRole).catch(err => {
        console.error('Failed to add base staff role:', err);
        return message.reply(':x: I could not add the base staff role. Check my role hierarchy and permissions.');
      });
    }

    // Save staff record
    const newStaff = new Staff({
      guildId: message.guild.id,
      userId: user.id,
      currentRank: 0
    });
    await newStaff.save();

    await logAction(
      message.client,
      'promotions',
      ':green_circle: Staff Added',
      `**User:** ${user.tag} (${user.id})\n**Added by:** ${message.author.tag}`
    );

    return message.reply(`✅ ${user.tag} has been added as staff and given the base staff role.`);
  }
};