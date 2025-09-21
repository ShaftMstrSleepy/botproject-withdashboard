const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    username: String,
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);