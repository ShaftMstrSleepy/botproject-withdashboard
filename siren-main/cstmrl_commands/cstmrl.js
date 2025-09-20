const CustomRole = require("../models/CustomRole");
const { EmbedBuilder } = require("discord.js");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "cstmrl",
  description: "List custom roles you can manage (claimed roles only)",
  async execute(message) {
    try {
      const roles = await CustomRole.find({
        claimed: true, // show only claimed roles
        $or: [{ ownerId: message.author.id }, { coOwners: message.author.id }]
      });

      if (!roles.length) {
        return message.reply("ℹ️ You don’t currently manage any claimed custom roles.");
      }

      const embed = new EmbedBuilder()
        .setTitle("🎟️ Your Managed Custom Roles")
        .setColor("Blue")
        .setDescription(
          roles
            .map(r => `**${r.codeName}** – <@&${r.roleId}> (Owner: <@${r.ownerId}>)`)
            .join("\n")
        )
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("cstmrl error:", err);
      await errorLogger(message.client, "cstmrl", err);
    }
  }
};