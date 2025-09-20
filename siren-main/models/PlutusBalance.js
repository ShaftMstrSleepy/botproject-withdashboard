// siren-main/models/PlutusBalance.js
const mongoose = require("mongoose");

const PlutusBalanceSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 }
}, {
  collection: "balance" // <-- keeps using the existing 'balance' collection
});

module.exports = mongoose.model("PlutusBalance", PlutusBalanceSchema);