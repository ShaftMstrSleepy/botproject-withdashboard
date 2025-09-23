// siren-main/models/GuildConfig.js
const mongoose = require('mongoose');

/**
 * One document per Discord guild.
 * All per-server settings live here and are edited via your dashboard.
 * Order staffRoles LOWEST -> HIGHEST.
 */
const GuildConfigSchema = new mongoose.Schema({
  guildId:       { type: String, required: true, unique: true },
  prefix:        { type: String, default: '!' },

  // Staff/role hierarchy (dashboard-managed)
  staffRoles:    { type: [String], default: [] },   // ordered lowest -> highest
  baseStaffRole: { type: String, default: null },   // optional "Staff" umbrella role
  mutedRoleId:   { type: String, default: null },   // role to apply on mute

  // Channels used by logging (dashboard-managed)
  logChannels: {
    type: new mongoose.Schema({
      general:      { type: String, default: null },
      promotions:   { type: String, default: null },
      punishments:  { type: String, default: null },
      appeals:      { type: String, default: null },
      ownership:    { type: String, default: null },
      blacklist:    { type: String, default: null },
      errors:       { type: String, default: null },
    }, { _id: false }),
    default: () => ({}),
  },

  // Command-specific config
  staffChannel:  { type: String, default: null },   // where appeals get posted

  // Any other per-guild settings you want the dashboard to control:
  defaultVoteThreshold: {
    type: new mongoose.Schema({
      accept: { type: Number, default: 3 },
      deny:   { type: Number, default: 3 },
    }, { _id: false }),
    default: () => ({})
  },

  // example flag to delay appeals (hours)
  appealDelayHours: { type: Number, default: 24 },

  // 🔹 Per-command enable/disable + role restrictions
  commandSettings: {
    type: Map,
    of: new mongoose.Schema({
      enabled: { type: Boolean, default: true },
      roles:   { type: [String], default: [] }   // role IDs allowed to use the command
    }, { _id: false }),
    default: () => ({})
  }
}, { timestamps: true });

module.exports = mongoose.model('GuildConfig', GuildConfigSchema);