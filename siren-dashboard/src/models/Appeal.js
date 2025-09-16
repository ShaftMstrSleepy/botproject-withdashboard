import mongoose from "mongoose";

const AppealSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId:  { type: String, required: true },
  type:    { type: String, enum: ["warn","mute","ban","blacklist"], required: true },
  reason:  { type: String, required: true },
  evidenceUrl: { type: String, default: "" },

  // moderation workflow
  status: { type: String, enum: ["pending","accepted","denied"], default: "pending" },
  votes: {
    accept: { type: [String], default: [] },
    deny:   { type: [String], default: [] }
  },
  voteThreshold: {
    accept: { type: Number, default: 3 },
    deny:   { type: Number, default: 3 }
  },

  caseId: { type: String, default: "" }, // optional link back to punishment
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Appeal", AppealSchema);
