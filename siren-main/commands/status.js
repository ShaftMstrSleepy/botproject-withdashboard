// commands/status.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Punishment = require("../models/Punishment");
const Blacklist = require("../models/Blacklist");
const errorLogger = require("../utils/errorLogger");

module.exports = {
  name: "status",
  description: "View a member’s punishments, blacklist status, and history.",
  async execute(message, args) {
    try {
      // ── Determine target user ──
      const target =
        message.mentions.users.first() ||
        (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : message.author);
      if (!target) return message.reply("⚠️ Could not find that user.");

      // ── Fetch data ──
      const twoWeeksAgo = Date.now() - 1000 * 60 * 60 * 24 * 14;
      const oneYearAgo  = Date.now() - 1000 * 60 * 60 * 24 * 365;

      const punishments = await Punishment.find({ userId: target.id }).sort({ createdAt: -1 });
      const blacklist   = await Blacklist.findOne({ userId: target.id });

      // Separate active vs. inactive
      const recent = punishments.filter(p => p.createdAt >= twoWeeksAgo);
      const year   = punishments.filter(
        p => p.createdAt < twoWeeksAgo && p.createdAt >= oneYearAgo
      );

      // Helper to format punishment rows
      const fmt = p =>
        `• **${p.type.toUpperCase()}** – ${p.reason || "No reason"}  (<t:${Math.floor(p.createdAt/1000)}:R>)`;

      // Base embed
      const baseEmbed = new EmbedBuilder()
        .setTitle(`📝 Status Report – ${target.tag}`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setColor("Blue")
        .setDescription(
          blacklist
            ? `🚨 **ACTIVE BLACKLIST** – Reason: **${blacklist.reason || "No reason given"}**\n\n`
            : "✅ Not blacklisted.\n\n" +
              "*Use the buttons below to view punishments.*"
        )
        .setFooter({ text: "Select which history to view with the buttons below." })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("status_active")
          .setLabel("Active (Last 2 Weeks)")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("status_year")
          .setLabel("Past Year History")
          .setStyle(ButtonStyle.Secondary)
      );

      const sent = await message.channel.send({ embeds: [baseEmbed], components: [row] });

      // Collector for button interactions
      const filter = i => i.user.id === message.author.id;
      const collector = sent.createMessageComponentCollector({ filter, time: 5 * 60 * 1000 });

      collector.on("collect", async i => {
        if (i.customId === "status_active") {
          const embed = new EmbedBuilder()
            .setTitle(`⚡ Active Punishments – ${target.tag}`)
            .setColor("Red")
            .setDescription(
              [
                blacklist
                  ? `🚨 **BLACKLISTED** – ${blacklist.reason || "No reason"}` 
                  : "No blacklist",
                recent.length
                  ? recent.map(fmt).join("\n")
                  : "No punishments in the last 2 weeks."
              ].join("\n\n")
            )
            .setTimestamp();
          await i.update({ embeds: [embed], components: [row] });
        } else if (i.customId === "status_year") {
          const embed = new EmbedBuilder()
            .setTitle(`📜 Past Year Punishment History – ${target.tag}`)
            .setColor("DarkBlue")
            .setDescription(
              year.length ? year.map(fmt).join("\n") : "No punishments in the past year."
            )
            .setTimestamp();
          await i.update({ embeds: [embed], components: [row] });
        }
      });

      collector.on("end", () => {
        row.components.forEach(btn => btn.setDisabled(true));
        sent.edit({ components: [row] }).catch(() => {});
      });
    } catch (err) {
      console.error("status command error:", err);
      await errorLogger(message.client, "status", err);
      return message.reply("❌ There was an error fetching status data.");
    }
  }
};