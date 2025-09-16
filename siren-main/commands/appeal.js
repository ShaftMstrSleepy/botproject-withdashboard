const Punishment = require('../models/Punishment');
const Appeal = require('../models/Appeal');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logAction = require('../utils/logger');
const config = require('../config.json');

module.exports = {
  name: 'appeal',
  description: 'Submit appeal: !appeal <caseId> <reason...>',
  async execute(message, args) {
    const caseId = args[0];
    const reason = args.slice(1).join(' ') || 'No reason provided';
    if (!caseId) return message.reply('⚠️ Usage: !appeal <caseId> <reason>');

    const punishment = await Punishment.findOne({ caseId });
    if (!punishment) return message.reply('❌ Punishment not found.');

    if (punishment.userId !== message.author.id) return message.reply('❌ You can only appeal punishments against your account.');

    // check delay
    const delayHours = config.appealDelayHours || 24;
    const now = Date.now();
    if (now - new Date(punishment.timestamp).getTime() < delayHours * 3600 * 1000) {
      return message.reply(`⚠️ You must wait ${delayHours} hours after punishment before appealing.`);
    }

    const past = await Punishment.find({ userId: message.author.id }).sort({ timestamp: -1 });
    const pastCount = past.length;
    const lastPun = past[0];

    const voteThreshold = {
      accept: config.defaultVoteThreshold?.accept || 3,
      deny: config.defaultVoteThreshold?.deny || 3
    };

    const appeal = new Appeal({
      userId: message.author.id,
      caseId,
      reason,
      voteThreshold,
      pastCount,
      lastPunishment: lastPun?.timestamp ?? null
    });
    await appeal.save();

    // build embed for staff
    const embed = new EmbedBuilder()
      .setTitle(`Appeal Case ${caseId}`)
      .addFields(
        { name: 'User', value: `<@${message.author.id}>`, inline: true },
        { name: 'User ID', value: `${message.author.id}`, inline: true },
        { name: 'Punishment Type', value: `${punishment.type}`, inline: true },
        { name: 'Punishment Reason', value: `${punishment.reason}` },
        { name: 'Appeal Reason', value: `${reason}` },
        { name: 'Punishment Time', value: `<t:${Math.floor(new Date(punishment.timestamp).getTime()/1000)}:F>` },
        { name: 'Past Punishments', value: `${pastCount}`, inline: true },
        { name: 'Last Punishment', value: lastPun ? `<t:${Math.floor(new Date(lastPun.timestamp).getTime()/1000)}:F>` : 'N/A', inline: true },
        { name: 'Accept Votes', value: '0', inline: true },
        { name: 'Deny Votes', value: '0', inline: true }
      )
      .setColor('Yellow')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`appeal_accept_${appeal._id}`).setLabel('Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`appeal_deny_${appeal._id}`).setLabel('Deny').setStyle(ButtonStyle.Danger)
    );

    // find staff channel by name or id
    const guild = message.guild;
    const staffChannelIdentifier = config.staffChannel;
    const staffChannel = guild.channels.cache.find(c => c.name === staffChannelIdentifier) || guild.channels.cache.get(staffChannelIdentifier);
    if (!staffChannel) {
      await appeal.delete().catch(()=>{});
      return message.reply('❌ Staff channel not found. Contact an admin.');
    }

    const sent = await staffChannel.send({ embeds: [embed], components: [row] });
    appeal.messageId = sent.id;
    await appeal.save();

    await logAction(message.client, 'appeals', '📨 New Appeal', `**User:** ${message.author.tag}\n**Case:** ${caseId}\n**Reason:** ${reason}`);
    return message.reply('✅ Your appeal has been submitted and sent to staff.');
  }
};