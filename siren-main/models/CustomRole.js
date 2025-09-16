const mongoose = require("mongoose");

const CustomRoleSchema = new mongoose.Schema({
  codeName: { type: String, required: true, unique: true },
  roleId:   { type: String, required: true },
  ownerId:  { type: String, default: "" },       // blank until claimed
  coOwners: { type: [String], default: [] },
  claimed:  { type: Boolean, default: false }    // NEW: must be true to appear in !cstmrl
});

module.exports = mongoose.model("CustomRole", CustomRoleSchema);