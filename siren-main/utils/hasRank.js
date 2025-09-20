// siren-main/utils/hasRank.js
/**
 * Check if a member has a staff role at or above a required index.
 * `guildCfg.staffRoles` must be ordered LOWEST -> HIGHEST.
 */
function hasRequiredRank(member, minRankIndex, guildCfg) {
  const ladder = Array.isArray(guildCfg?.staffRoles) ? guildCfg.staffRoles : [];
  if (!ladder.length) return false;
  const required = new Set(ladder.slice(minRankIndex));
  return member.roles.cache.some(r => required.has(r.id));
}

module.exports = { hasRequiredRank };
