// commands/listroles.js
const { EmbedBuilder } = require("discord.js");
const CustomRole = require("../models/CustomRole");
const config = require("../config.json");

module.exports = {
  name: "listroles",
  description: "!listroles – Show all custom roles with owner & co-owner details",
  async execute(message) {
    // ── Only Owner or Management ──
    if (
      message.author.id !== config.ownerId &&
      !message.member.roles.cache.has("1232894786684588062")
    ) {
      return message.reply("❌ Only the Owner or Management can use this command.");
    }

    // ── Fetch roles ──
    const roles = await CustomRole.find().sort({ codeName: 1 });
    if (!roles.length) {
      return message.reply("ℹ️ No custom roles are stored in the database.");
    }

    // ── Build display lines ──
    const lines = roles.map(r => {
      const ownerText = r.ownerId
        ? `**Owner:** <@${r.ownerId}>`
        : "**Owner:** _Unclaimed_";

      const coText = r.coOwners && r.coOwners.length
        ? `**Co-Owners:** ${r.coOwners.map(id => `<@${id}>`).join(", ")}`
        : "**Co-Owners:** _None_";

      return `• **${r.codeName}** – <@&${r.roleId}>  
         ${ownerText}  
         ${coText}`;
    });

    // ── Embed ──
    const embed = new EmbedBuilder()
      .setTitle("🎨 Custom Role Database Overview")
      .setColor("DarkGreen")
      .setDescription(lines.join("\n\n"))
      .setFooter({ text: "Shows claimed/unclaimed status with owners & co-owners." })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }
};