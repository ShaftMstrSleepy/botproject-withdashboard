// utils/hasRank.js
// Checks if a member has at least a given staff rank based on env or GuildConfig
const config = require("../config");

function hasRequiredRank(member, minRankIndex) {
  // staffRoleIds is a comma-separated list in .env or can be pulled per-guild later
  const staffRoles = config.STAFF_ROLE_IDS || [];
  return member.roles.cache.some(r => staffRoles.slice(minRankIndex).includes(r.id));
}

module.exports = { hasRequiredRank };