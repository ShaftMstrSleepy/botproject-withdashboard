const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  currentRank: { type: Number, default: 0 },
  joinDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Staff', StaffSchema);