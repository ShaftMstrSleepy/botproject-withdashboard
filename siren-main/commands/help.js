const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require("discord.js");

module.exports = {
  name: "help",
  description: "Interactive help menu with category buttons",
  async execute(message) {
    // ---- Embeds ----
    const generalEmbed = new EmbedBuilder()
      .setTitle("💡 General Commands")
      .setColor("Blue")
      .setDescription(
        "• **!help** – Show this help menu.\n\n" +
        "• **!status [@user|ID]** – *Everyone (self), Trial Mod+ (others)*\n" +
        "   _Example:_ `!status` (self) or `!status @User` (staff)\n" +
        "   View your own punishments/warnings and active cases, or—if staff—view someone else’s.\n\n" +
        "• **!appeal** – Submit an appeal for a punishment.\n" +
        "   _Example:_ `!appeal mute \"I understand the rules now\"`\n\n" +
        "• **!balance** – View your Plutus balance."
      );

    const roleEmbed = new EmbedBuilder()
      .setTitle("🎭 Role-Based Commands")
      .setColor("Green")
      .setDescription(
        "• **!claimrole `<codeName>`** – Claim a purchased custom role.\n" +
        "   _Example:_ `!claimrole dragon`\n\n" +
        "• **!cstmrl** – List the roles you manage.\n" +
        "   _Example:_ `!cstmrl`\n\n" +
        "• **!cstmrladd `<codeName>` `<@user|ID>`** – Grant co-ownership of a custom role.\n" +
        "   _Example:_ `!cstmrladd dragon @User`\n\n" +
        "• **!cstmrltake `<codeName>` `<@user|ID>`** – Remove a co-owner.\n" +
        "   _Example:_ `!cstmrltake dragon @User`\n\n" +
        "• **!role `<codeName>` `<@user|ID>`** – Add or remove a role you own/co-own.\n" +
        "   _Example:_ `!role dragon @User`\n\n" +
        "• **!purge `<codeName>`** – Remove your role from all members.\n" +
        "   _Example:_ `!purge dragon`\n" +
        "   _Cost:_ **5 Plutus** (server currency)."
      );

    // ---- Buttons ----
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("general")
        .setLabel("General")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("roles")
        .setLabel("Role-Based")
        .setStyle(ButtonStyle.Success)
    );

    const sent = await message.channel.send({
      embeds: [generalEmbed],
      components: [row]
    });

    const collector = sent.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "general") {
        await interaction.update({ embeds: [generalEmbed], components: [row] });
      } else if (interaction.customId === "roles") {
        await interaction.update({ embeds: [roleEmbed], components: [row] });
      }
    });
  }
};