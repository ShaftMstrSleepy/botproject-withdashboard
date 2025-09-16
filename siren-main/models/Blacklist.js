const mongoose = require("mongoose");

const BlacklistSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  reason: { type: String, default: "No reason given" }
}, { timestamps: true });

module.exports = mongoose.model("Blacklist", BlacklistSchema);