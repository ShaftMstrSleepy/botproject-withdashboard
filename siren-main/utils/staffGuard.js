// siren-main/utils/staffGuard.js
const config = require('../config');

// true if member has ANY staff/admin role from env
function isStaff(member) {
  if (!member || !member.roles) return false;
  const allAllowed = new Set([
    ...config.STAFF_ROLE_IDS,
    ...config.ADMIN_ROLE_IDS,
  ]);
  return member.roles.cache?.some(r => allAllowed.has(r.id)) || false;
}

// throw or return a small object you can use inline in commands
function ensureStaff(member) {
  if (isStaff(member)) return { ok: true };
  return { ok: false, reason: "You must be staff to use this command." };
}

module.exports = { isStaff, ensureStaff };