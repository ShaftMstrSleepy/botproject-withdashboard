const mongoose = require('mongoose');

const AppealSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  caseId: { type: String, required: true },
  reason: { type: String, default: 'No reason provided' },
  submittedAt: { type: Date, default: Date.now },
  votes: {
    accept: { type: [String], default: [] },
    deny: { type: [String], default: [] }
  },
  voteThreshold: {
    accept: { type: Number, default: 3 },
    deny: { type: Number, default: 3 }
  },
  status: { type: String, enum: ['pending','accepted','denied'], default: 'pending' },
  messageId: { type: String, default: null },
  pastCount: { type: Number, default: 0 },
  lastPunishment: { type: Date, default: null }
});

module.exports = mongoose.model('Appeal', AppealSchema);