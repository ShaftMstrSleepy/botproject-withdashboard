// utils/ownerGuard.js
const OWNER_IDS = process.env.OWNER_IDS?.split(",") || [];

function ensureOwner(userId) {
  if (isOwner(userId)) return { ok: true };
  return { ok: false, reason: "Owner command." };
}

module.exports = function isOwner(userId) {
  return OWNER_IDS.includes(userId);
};