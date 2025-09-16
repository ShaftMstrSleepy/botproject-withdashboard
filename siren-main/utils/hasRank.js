const config = require("../config.json");

function hasRequiredRank(member, minRankIndex) {
  // true if member has a staff role >= the required index
  return member.roles.cache.some(r => config.staffRoles.slice(minRankIndex).includes(r.id));
}

module.exports = { hasRequiredRank };