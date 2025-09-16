// src/models/GuildConfig.js
import mongoose from "mongoose";

const SirenPlusSchema = new mongoose.Schema({
  active: { type: Boolean, default: false },          // subscription active now
  plan: { type: String, enum: ["roles", "troll", ""], default: "" }, // selected plan
  purchaseCode: { type: String, default: "" },        // used to attribute purchases
  cancelAt: { type: Date, default: null },            // if user cancels, keep rights until this time
  features: {
    roles: { type: Boolean, default: false },         // custom role commands
    troll: { type: Boolean, default: false }          // troll commands
  }
}, { _id: false });

const CustomRoleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roleId: { type: String, required: true },
  price: { type: Number, default: 0 },                // price in Plutus
  enabled: { type: Boolean, default: true }
}, { _id: false });

const GuildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  guildName: { type: String, default: "" },
  prefix: { type: String, default: "!" },

  // Optional for bot operations (mute restore on join, etc.)
  mutedRoleId: { type: String, default: "" },

  staffRoles: {
    base:       { type: String, default: "" },
    trialMod:   { type: String, default: "" },
    mod:        { type: String, default: "" },
    seniorMod:  { type: String, default: "" },
    retired:    { type: String, default: "" },
    management: { type: String, default: "" }
  },

  logChannels: {
    punishments: [String],
    promotions:  [String],
    ownership:   [String],
    appeals:     [String],
    general:     [String]
  },

  voteThreshold: {
    accept: { type: Number, default: 3 },
    deny:   { type: Number, default: 3 }
  },

  // Siren Plus subscription & feature gating
  sirenPlus: { type: SirenPlusSchema, default: () => ({}) },

  // For Siren Plus custom role commands
  customRoles: { type: [CustomRoleSchema], default: [] },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

GuildConfigSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("GuildConfig", GuildConfigSchema);

