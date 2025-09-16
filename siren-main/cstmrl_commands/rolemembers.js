const { EmbedBuilder } = require("discord.js");
const CustomRole = require("../models/CustomRole");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "rolemembers",
  description: "DM the role owner a list of all members with the role (by code name)",
  usage: "!rolemembers <codeName>",
  async execute(message, args, config, client) {
    try {
      const codeName = args[0];
      if (!codeName) {
        return message.reply("⚠️ Please provide the role’s code name. Example: `!rolemembers vipcode`");
      }

      // Fetch role record from DB
      const roleDoc = await CustomRole.findOne({ codeName: codeName.toLowerCase() });
      if (!roleDoc) {
        return message.reply("❌ No custom role found with that code name.");
      }

      const guild = message.guild;
      const role = guild.roles.cache.get(roleDoc.roleId);
      if (!role) {
        return message.reply("⚠️ That Discord role no longer exists.");
      }

      // Collect all members with the role
      const members = role.members.map(m => `${m.user.tag} (<@${m.id}>)`);
      const memberList = members.length
        ? members.join("\n")
        : "_No one currently has this role._";

      // DM the owner with the full list
      const owner = await client.users.fetch(roleDoc.ownerId).catch(() => null);
      if (!owner) {
        return message.reply("⚠️ Could not DM the role owner (user not found).");
      }

      const embed = new EmbedBuilder()
        .setTitle(`👥 Members with ${role.name}`)
        .setDescription(memberList)
        .setColor("Blue")
        .setFooter({ text: `Code name: ${roleDoc.codeName}` })
        .setTimestamp();

      await owner.send({ embeds: [embed] });

      // Confirmation in the channel with count
      return message.reply(
        `✅ Sent a list of **${members.length}** member(s) who currently have **${role.name}** to the role owner’s DMs.`
      );
    } catch (err) {
      console.error("rolemembers command error:", err);
      await errorLogger(client, "rolemembers", err);
      return message.reply("❌ Something went wrong while sending the member list.");
    }
  }
};