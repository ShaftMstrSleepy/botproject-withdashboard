const mongoose = require('mongoose');

const punishmentSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  type: { type: String, required: true }, // e.g. mute, ban, warn
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  moderatorId: { type: String, required: true },
  muted: { type: Boolean, default: false } // track if user was muted
});

module.exports = mongoose.model('Punishment', punishmentSchema);