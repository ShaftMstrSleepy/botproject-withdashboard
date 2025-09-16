const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  name: "staffhelp",
  description: "Interactive help menu for staff commands with rank requirements",
  async execute(message) {
    // ── Verify Staff ──
    if (!message.member.permissions.has("ManageRoles")) {
      return message.reply("❌ This command is for staff only.");
    }

    // Link to the Staff Guide
    const guideLink = "[📘 Staff Guide](https://discordapp.com/channels/1232761694141550672/1232790980630024322)";

    // ── Embeds by Category ──
    const moderationEmbed = new EmbedBuilder()
      .setTitle("🛡️ Moderation Commands")
      .setColor("Purple")
      .setDescription(
        `For more details or clarifications, please refer to the ${guideLink}\n\n` +
        "**Punishments & Appeals**\n\n" +
        "• **!warn `<@user|ID>` `<reason>`** – *Rank:* **Trial Mod+**\n" +
        "   _Example:_ `!warn @User Spamming`\n" +
        "   Warn a user and log the reason.\n\n" +
        "• **!mute `<@user|ID>` `<reason>`** – *Rank:* **Trial Mod+**\n" +
        "   _Example:_ `!mute @User Inappropriate language`\n" +
        "   Mute a user and give them the muted role.\n\n" +
        "• **!unmute `<@user|ID>`** – *Rank:* **Trial Mod+**\n" +
        "   _Example:_ `!unmute @User`\n" +
        "   Remove the muted role from a user.\n\n" +
        "• **!ban `<@user|ID>` `<reason>`** – *Rank:* **Mod+**\n" +
        "   _Example:_ `!ban @User Severe harassment`\n" +
        "   Ban a user from the server.\n\n" +
        "• **!status [@user|ID]** – *Rank:* **Everyone (self), Trial Mod+ (others)**\n" +
        "   _Example:_ `!status` (self) or `!status @User` (staff)\n" +
        "   View a member’s punishments, warnings, and active cases.\n\n" +
        "• **!appeal** – *Rank:* **All Members**\n" +
        "   _Example:_ `!appeal mute \"I understand the rules now\"`\n" +
        "   User command to request an appeal for a punishment."
      )
      .setFooter({ text: "Use the buttons below to switch sections." });

    const staffMgmtEmbed = new EmbedBuilder()
      .setTitle("👥 Staff Management Commands")
      .setColor("DarkBlue")
      .setDescription(
        `For more details or clarifications, please refer to the ${guideLink}\n\n` +
        "**Promotions & Staff Roles**\n\n" +
        "• **!addstaff `<@user|ID>`** – *Rank:* **Management/Owner**\n" +
        "   _Example:_ `!addstaff @User`\n" +
        "   Add a user to the staff database and give base staff roles.\n\n" +
        "• **!promote `<@user|ID>`** – *Rank:* **Management/Owner**\n" +
        "   _Example:_ `!promote @User`\n" +
        "   Promote staff through Trial Mod → Mod → Retired → Management.\n\n" +
        "• **!demote `<@user|ID>`** – *Rank:* **Management/Owner**\n" +
        "   _Example:_ `!demote @User`\n" +
        "   Demote staff down one rank.\n\n" +
        "• **!removestaff `<@user|ID>`** – *Rank:* **Management/Owner**\n" +
        "   _Example:_ `!removestaff @User`\n" +
        "   Remove a user from the staff database and roles.\n\n" +
        "• **!unban `<userID>` `[reason]`** – *Rank:* **Management/Owner**\n" +
        "   _Example:_ `!unban 123456789012345678 Apology accepted`\n" +
        "   Unban a user, DM them a one-time invite to rejoin, and log the action.\n\n" +
        "• **!addplutus `<@user|ID>` `<amount>`** – *Rank:* **Management/Owner**\n" +
        "   _Example:_ `!addplutus @User 50`\n" +
        "   Add a specified amount of Plutus to a user's balance.\n\n" +
        "• **!removeplutus `<@user|ID>` `<amount>`** – *Rank:* **Management/Owner**\n" +
        "   _Example:_ `!removeplutus @User 20`\n" +
        "   Remove a specified amount of Plutus from a user's balance.\n\n" +
        "• **!blacklist `<@user|ID>` `<reason>`** – *Rank:* **Management/Owner**\n" +
        "   _Example:_ `!blacklist @User Spamming commands`\n" +
        "   Blacklist a user from using most bot commands (except `!help`, `!appeal`, `!balance`) and log the reason.\n\n" +
        "• **!staffinfo `<@user|ID>`** – *Rank:* **Management/Owner**\n" +
        "   _Example:_ `!staffinfo @User`\n" +
        "   View detailed staff database info, including current rank and history.\n\n" +
        "• **!addrlowner `<codeName>` `<userID>`** – *Rank:* **Management/Owner**\n" +
        "   _Example:_ `!addrlowner vipcode 123456789012345678`\n" +
        "   Assign a specific user ID as the allowed owner of a custom role.\n\n" +
        "• **!setrank `<@user|ID>` `<rank>`** – *Rank:* **Management/Owner**\n" +
        "   _Example:_ `!setrank @User Mod`\n" +
        "   Set or change a staff member’s rank.\n\n" +
        "• **!removeowner `<codeName>`** – *Rank:* **Management/Owner**\n" +
        "   _Example:_ `!removeowner vipcode`\n" +
        "   Remove ownership of a custom role so it can be reassigned."
      )
      .setFooter({ text: "Use the buttons below to switch sections." });

    const customRoleEmbed = new EmbedBuilder()
      .setTitle("🎨 Custom Role Commands")
      .setColor("DarkGreen")
      .setDescription(
        "**Owned/Custom Role System**\n\n" +
        "• **!claimrole `<code>`** – *Rank:* **Role Owner**\n" +
        "   _Example:_ `!claimrole vipcode`\n" +
        "   Claim a purchased role and become the owner.\n\n" +
        "• **!cstmrl** – *Rank:* **Role Owner/Co-Owner**\n" +
        "   _Example:_ `!cstmrl`\n" +
        "   Show the custom roles you can manage.\n\n" +
        "• **!cstmrladd `<code>` `<@user|ID>`** – *Rank:* **Role Owner**\n" +
        "   _Example:_ `!cstmrladd vipcode @User`\n" +
        "   Add a co-owner for your role.\n\n" +
        "• **!cstmrltake `<code>` `<@user|ID>`** – *Rank:* **Role Owner**\n" +
        "   _Example:_ `!cstmrltake vipcode @User`\n" +
        "   Remove a co-owner and the role from them.\n\n" +
        "• **!role `<code>` `<@user|ID>`** – *Rank:* **Role Owner/Co-Owner**\n" +
        "   _Example:_ `!role vipcode @User`\n" +
        "   Give or remove your managed role from a user.\n\n" +
        "• **!purgerole `<code>`** – *Rank:* **Role Owner**\n" +
        "   _Example:_ `!purgerole vipcode`\n" +
        "   Remove the role from everyone. **Cost:** 5 Plutus."
      )
      .setFooter({ text: "Use the buttons below to switch sections." });

    const databaseEmbed = new EmbedBuilder()
      .setTitle("🗂️ Database & Logs")
      .setColor("DarkGold")
      .setDescription(
        "**Database Query Commands**\n\n" +
        "• **!showdb `<Collection>`** – *Rank:* **Management/Owner**\n" +
        "   _Example:_ `!showdb CustomRole`\n" +
        "   View documents in a database collection.\n" +
        "   _Available Collections:_ **Appeal**, **Balance**, **Blacklist**, **CustomRole**, **Punishment**, **RoleOwnership**, **Staff**.\n\n" +
        "• **!listroles** – *Rank:* **Management/Owner**\n" +
        "   _Example:_ `!listroles`\n" +
        "   Lists all custom roles showing claimed/unclaimed status, owners, and all co-owners."
      )
      .setFooter({ text: "Use the buttons below to switch sections." });

    // ── Buttons ──
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("staffhelp_moderation")
        .setLabel("Moderation")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("staffhelp_staffmgmt")
        .setLabel("Staff Mgmt")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("staffhelp_customrole")
        .setLabel("Custom Roles")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("staffhelp_database")
        .setLabel("Database")
        .setStyle(ButtonStyle.Danger)
    );

    const sent = await message.channel.send({
      embeds: [moderationEmbed],
      components: [row]
    });

    const filter = i => i.user.id === message.author.id;
    const collector = sent.createMessageComponentCollector({ filter, time: 5 * 60 * 1000 });

    collector.on("collect", async i => {
      if (i.customId === "staffhelp_moderation") {
        await i.update({ embeds: [moderationEmbed], components: [row] });
      } else if (i.customId === "staffhelp_staffmgmt") {
        await i.update({ embeds: [staffMgmtEmbed], components: [row] });
      } else if (i.customId === "staffhelp_customrole") {
        await i.update({ embeds: [customRoleEmbed], components: [row] });
      } else if (i.customId === "staffhelp_database") {
        await i.update({ embeds: [databaseEmbed], components: [row] });
      }
    });

    collector.on("end", () => {
      row.components.forEach(btn => btn.setDisabled(true));
      sent.edit({ components: [row] }).catch(() => {});
    });
  }
};