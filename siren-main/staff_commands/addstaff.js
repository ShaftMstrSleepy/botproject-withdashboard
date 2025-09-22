const Staff = require('../models/Staff');
const logAction = require('../utils/logger');

module.exports = {
  name: 'addstaff',
  description: 'Add a user as staff: !addstaff <userMention|userId>',
  async execute(message, args, cfg, client) {
    if (!message.member.permissions.has('Administrator'))
      return message.reply(':x: You do not have permission.');

    // 🔎 Debug log to confirm what cfg contains
    console.log('AddStaff cfg:', JSON.stringify(cfg, null, 2));

    const baseRoleId = cfg?.staffRoles?.base;
    if (!baseRoleId) {
      return message.reply(
        ':warning: A base staff role has not been set in the dashboard for this server. Please configure it before using this command.'
      );
    }

    const arg = args[0];
    const user =
      message.mentions.users.first() ||
      (arg ? await message.client.users.fetch(arg).catch(() => null) : null);
    if (!user) return message.reply(':warning: Please mention a user or provide their ID.');

    const existing = await Staff.findOne({ userId: user.id });
    if (existing) return message.reply(':x: This user is already staff.');

    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (member) {
      if (!member.roles.cache.has(baseRoleId)) {
        await member.roles.add(baseRoleId).catch(() => {});
      }
    }

    const newStaff = new Staff({ userId: user.id, currentRank: 0 });
    await newStaff.save();

    await logAction(
      message.client,
      'promotions',
      ':green_circle: Staff Added',
      `**User:** ${user.tag} (${user.id})\n**Added by:** ${message.author.tag}`
    );
    return message.reply(`✅ ${user.tag} has been added as staff (rank 0).`);
  }
};