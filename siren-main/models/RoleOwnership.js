// models/RoleOwnership.js
const mongoose = require('mongoose');

const RoleOwnershipSchema = new mongoose.Schema({
  guildId:   { type: String, required: true },           // Discord server ID
  roleId:    { type: String, required: true },           // Discord role ID
  code:      { type: String, required: true, lowercase: true, index: true }, // unique code name
  ownerId:   { type: String, required: true },           // primary owner
  coOwners:  { type: [String], default: [] },            // optional co-owners
  claimPending: { type: Boolean, default: false }        // true if role is unclaimed after purge
});

// Ensure guild + code is unique so the same code can’t be reused in the same server.
RoleOwnershipSchema.index({ guildId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('RoleOwnership', RoleOwnershipSchema);