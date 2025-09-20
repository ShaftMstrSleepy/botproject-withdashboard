const Staff = require('../models/Staff');
const logAction = require('../utils/logger');
const config = require("../config");

module.exports = {
  name: 'addstaff',
  description: 'Add a user as staff: !addstaff <userMention|userId>',
  async execute(message, args, cfg, client) {
    if (!message.member.permissions.has('Administrator')) return message.reply('❌ You do not have permission.');

    const arg = args[0];
    const user = message.mentions.users.first() || (arg ? await message.client.users.fetch(arg).catch(()=>null) : null);
    if (!user) return message.reply('⚠️ Please mention a user or provide their ID.');

    const existing = await Staff.findOne({ userId: user.id });
    if (existing) return message.reply('❌ This user is already staff.');

    const member = await message.guild.members.fetch(user.id).catch(()=>null);
    // Add roles by ID if provided in config
    if (member) {
      if (config.baseStaffRole && !member.roles.cache.has(config.baseStaffRole)) {
        await member.roles.add(config.baseStaffRole).catch(()=>{});
      }
      if (Array.isArray(config.staffRoles) && config.staffRoles[0]) {
        const lowest = config.staffRoles[0];
        if (!member.roles.cache.has(lowest)) await member.roles.add(lowest).catch(()=>{});
      }
    }

    const newStaff = new Staff({ userId: user.id, currentRank: 0 });
    await newStaff.save();

    await logAction(message.client, 'promotions', '🟢 Staff Added', `**User:** ${user.tag} (${user.id})\n**Added by:** ${message.author.tag}`);
    return message.reply(`✅ ${user.tag} has been added as staff (rank 0).`);
  }
};