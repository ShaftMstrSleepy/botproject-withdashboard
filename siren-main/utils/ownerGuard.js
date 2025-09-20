// siren-main/utils/ownerGuard.js
const config = require('../config');

function isOwner(userId) {
  return config.OWNER_IDS.includes(String(userId));
}

function ensureOwner(userId) {
  if (isOwner(userId)) return { ok: true };
  return { ok: false, reason: "Owner command." };
}

module.exports = { isOwner, ensureOwner };