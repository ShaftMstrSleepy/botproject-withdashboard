// siren-main/models/GuildConfig.js
const mongoose = require('mongoose');

const GuildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: '!' },
  // add other fields you had before
});

module.exports = mongoose.model('GuildConfig', GuildConfigSchema);