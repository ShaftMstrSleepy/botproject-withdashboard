// src/models/AppealConfig.js
import mongoose from "mongoose";

const AppealConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  welcomeMessage: { type: String, default: "" },
  waitHours: { type: Number, default: 24 }, // minimum hours before user can appeal
  categories: [{ type: String }],           // e.g. ["Ban","Mute","Warn"]
  resultChannelId: { type: String, default: "" },
  voteThreshold: {
    accept: { type: Number, default: 3 },
    deny:   { type: Number, default: 3 }
  }
});

export default mongoose.model("AppealConfig", AppealConfigSchema);
