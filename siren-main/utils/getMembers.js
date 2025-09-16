// utils/getMember.js
module.exports = async function getMember(message, raw) {
  try {
    if (!message.guild) return null;

    // Prefer explicit mention if present
    const mentioned = message.mentions.members.first();
    if (mentioned) return mentioned;

    if (!raw) return null;

    // Extract a numeric ID from <@123> or <@!123> or just 123
    const id = String(raw).replace(/[<@!>]/g, '');
    if (!/^\d{17,20}$/.test(id)) return null;

    const member = await message.guild.members.fetch(id).catch(() => null);
    return member || null;
  } catch {
    return null;
  }
};