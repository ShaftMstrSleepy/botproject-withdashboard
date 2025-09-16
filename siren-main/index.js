// index.js
const fs = require("fs");
const express = require("express"); // for local presence API
const {
  Client,
  Collection,
  GatewayIntentBits,
  Events
} = require("discord.js");
const mongoose = require("mongoose");
require("dotenv").config();

const config = require("./config.json");
const GuildConfig = require("./models/GuildConfig");   // per-guild settings
const Appeal = require("./models/Appeal");
const Punishment = require("./models/Punishment");
const Balance = require("./models/Balance");
const Blacklist = require("./models/Blacklist");
const logAction = require("./utils/logger");
const errorLogger = require("./utils/errorLogger");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ]
});

// ─── Load Prefix + Slash Commands ────────────────────────────────
client.commands = new Collection();
for (const file of fs.readdirSync("./commands").filter(f => f.endsWith(".js"))) {
  const cmd = require(`./commands/${file}`);
  if (!cmd.name && !cmd.data) continue;
  client.commands.set(cmd.name || cmd.data?.name, cmd);
}

// ─── Ready Event (includes restart notification) ─────────────────
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  if (client.restartChannelId) {
    const ch = await client.channels.fetch(client.restartChannelId).catch(() => null);
    if (ch) {
      ch.send(`✅ **Bot is back online** (restarted at <t:${Math.floor(Date.now() / 1000)}:F>)`);
    }
    client.restartChannelId = null;
  }
});

// ─── Ensure Balance Record Exists on Join ─────────────────────────
client.on("guildMemberAdd", async member => {
  try {
    let bal = await Balance.findOne({ userId: member.id });
    if (!bal) {
      bal = new Balance({ userId: member.id, balance: 0 });
      await bal.save();
      console.log(`💾 Created balance record for ${member.user.tag}`);
    }

    // 🔄 Reapply mute if user left while muted
    const activeMute = await Punishment.findOne({
      userId: member.id,
      type: "mute",
      active: true
    });

    if (activeMute) {
      // 🔁 pull per-guild settings from DB (instead of config.*)
      const gCfg = await GuildConfig.findOne({ guildId: member.guild.id }).lean().catch(() => null);

      // optional mutedRoleId in DB (top-level or under staffRoles if you want)
      const mutedRoleId =
        gCfg?.mutedRoleId ||
        gCfg?.staffRoles?.mutedRoleId || // if you later store it here
        null;

      if (mutedRoleId) {
        const muteRole = member.guild.roles.cache.get(mutedRoleId);
        if (muteRole) await member.roles.add(muteRole).catch(() => {});
      }

      // general log channel: first of array logChannels.general
      const generalId = Array.isArray(gCfg?.logChannels?.general) ? gCfg.logChannels.general[0] : null;
      if (generalId) {
        const general = member.guild.channels.cache.get(generalId);
        if (general && general.isTextBased?.()) {
          general.send(`🔇 Welcome back <@${member.id}> — your muted role has been restored.`);
        }
      }
    }
  } catch (err) {
    console.error("Balance/mute reapply error:", err);
    await errorLogger(client, "guildMemberAdd", err);
  }
});

// ─── Prefix Command Handler ──────────────────────────────────────
client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild) return;

  // 🔑 Fetch custom prefix for this guild (fallback to default)
  let guildCfg = await GuildConfig.findOne({ guildId: message.guild.id }).catch(() => null);
  const prefix = guildCfg?.prefix || config.prefix;

  if (!message.content.startsWith(prefix)) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const name = args.shift()?.toLowerCase();
  if (!name) return;

  // 🔒 ---- GLOBAL BLACKLIST CHECK ----
  try {
    const black = await Blacklist.findOne({ userId: message.author.id });
    if (black) {
      // allow only help & appeal
      if (!["help", "appeal"].includes(name)) {
        return message.reply({
          embeds: [{
            title: "🚨 You Are Blacklisted",
            description:
              `Reason: **${black.reason || "No reason given"}**\n\n` +
              "You cannot use bot commands until this blacklist is removed.\n" +
              "Please start an appeal using the **web dashboard form**.",
            color: 0xFF0000
          }]
        });
      }
      if (name === "appeal") {
        return message.reply({
          embeds: [{
            title: "🚫 Blacklist Appeal",
            description:
              "This blacklist must be appealed through the **web dashboard**.\n" +
              "Visit: [🔗 Appeal Form](https://yourdashboard.example/appeals)",
            color: 0xFF0000
          }]
        });
      }
    }
  } catch (err) {
    console.error("Blacklist check error:", err);
    await errorLogger(client, "blacklist-check", err);
  }
  // ---- END BLACKLIST CHECK ----

  const command = client.commands.get(name);
  if (!command) return;

  try {
    const exists = await Balance.findOne({ userId: message.author.id });
    if (!exists) await new Balance({ userId: message.author.id, balance: 0 }).save();
    await command.execute(message, args, config, client);
  } catch (err) {
    console.error("Command error:", err);
    await errorLogger(client, command.name, err);
    message.reply("❌ There was an error executing that command.");
  }
});

// ─── Slash Command Handler ───────────────────────────────────────
client.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      const exists = await Balance.findOne({ userId: interaction.user.id });
      if (!exists) await new Balance({ userId: interaction.user.id, balance: 0 }).save();
      await command.execute(interaction);
    } catch (error) {
      console.error("Slash command error:", error);
      await errorLogger(client, interaction.commandName, error);
      await interaction.reply({ content: "❌ There was an error executing this command.", ephemeral: true });
    }
    return;
  }

  // ── Appeal Voting Buttons ──
  if (!interaction.isButton()) return;
  const parts = interaction.customId.split("_");
  if (parts.length < 3 || parts[0] !== "appeal") return;

  const action = parts[1];
  const appealId = parts.slice(2).join("_");

  try {
    const appeal = await Appeal.findById(appealId);
    if (!appeal || appeal.status !== "pending") {
      return interaction.reply({ content: "Appeal not found or already resolved.", ephemeral: true });
    }

    const staffId = interaction.user.id;
    if (appeal.votes.accept.includes(staffId) || appeal.votes.deny.includes(staffId)) {
      return interaction.reply({ content: "⚠️ You already voted on this appeal.", ephemeral: true });
    }

    if (action === "accept") appeal.votes.accept.push(staffId);
    else if (action === "deny") appeal.votes.deny.push(staffId);
    else return interaction.reply({ content: "Invalid action.", ephemeral: true });

    if (appeal.votes.accept.length >= appeal.voteThreshold.accept) appeal.status = "accepted";
    if (appeal.votes.deny.length >= appeal.voteThreshold.deny) appeal.status = "denied";
    await appeal.save();

    if (appeal.status === "accepted") {
      try {
        const gCfg = await GuildConfig.findOne({ guildId: interaction.guild.id }).lean().catch(() => null);
        const mutedRoleId = gCfg?.mutedRoleId || gCfg?.staffRoles?.mutedRoleId || null;

        const member = await interaction.guild.members.fetch(appeal.userId).catch(() => null);
        if (member) {
          if (mutedRoleId && member.roles.cache.has(mutedRoleId)) {
            await member.roles.remove(mutedRoleId).catch(console.error);
          }
          await member.send(`✅ Your appeal (case ${appeal.caseId}) has been accepted.`).catch(() => {});
        }
      } catch (e) {
        await errorLogger(client, "appeal-accept", e);
      }
      await logAction(client, "appeals", `🟢 Appeal Accepted | Case ${appeal.caseId} | User <@${appeal.userId}>`);
    }

    if (appeal.status === "denied") {
      try {
        const member = await interaction.guild.members.fetch(appeal.userId).catch(() => null);
        if (member) {
          await member.send(`❌ Your appeal (case ${appeal.caseId}) has been denied.`).catch(() => {});
        }
      } catch (e) {
        await errorLogger(client, "appeal-deny-dm", e);
      }
      await logAction(client, "appeals", `🔴 Appeal Denied | Case ${appeal.caseId} | User <@${appeal.userId}>`);
    }

    return interaction.reply({ content: `Vote recorded: ${action}`, ephemeral: true });
  } catch (err) {
    console.error("Appeal interaction error:", err);
    await errorLogger(client, "appeal-interaction", err);
    return interaction.reply({ content: "❌ Error handling this appeal.", ephemeral: true });
  }
});

// ─── MongoDB & Login ────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("MongoDB error:", err);
    errorLogger(client, "MongoDB", err);
  });

client.login(process.env.BOT_TOKEN);

// ─── Presence API for Dashboard ─────────────────────────────────
const presenceCounts = new Map();

function updateGuildCounts(guild) {
  const total = guild.memberCount;
  const online = guild.members.cache.filter(m => m.presence?.status === "online").size;
  presenceCounts.set(guild.id, { online, total });
}

client.on("ready", () => {
  client.guilds.cache.forEach(g => updateGuildCounts(g));
  setInterval(() => client.guilds.cache.forEach(g => updateGuildCounts(g)), 60_000);
});

const presenceApp = express();
presenceApp.get("/api/guilds/:id/presence", (req, res) => {
  const data = presenceCounts.get(req.params.id) || { online: 0, total: 0 };
  res.json(data);
});
presenceApp.listen(process.env.PRESENCE_PORT || 3050, () =>
  console.log(`🌐 Presence API running on port ${process.env.PRESENCE_PORT || 3050}`)
);