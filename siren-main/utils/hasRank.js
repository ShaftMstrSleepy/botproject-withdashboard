// siren-main/utils/hasRank.js
/**
 * Check if a member has a staff role at or above a required index.
 * `guildCfg.staffRoles` can be an array (ordered LOWEST -> HIGHEST)
 * or an object with named keys.
 */
function hasRequiredRank(member, minRankIndex, guildCfg) {
  // Support both array or object storage of staffRoles
  let ladder = [];
  if (Array.isArray(guildCfg?.staffRoles)) {
    ladder = guildCfg.staffRoles;
  } else if (guildCfg?.staffRoles) {
    // ✅ include management when stored as an object
    ladder = [
      guildCfg.staffRoles.trialMod,
      guildCfg.staffRoles.mod,
      guildCfg.staffRoles.seniorMod,
      guildCfg.staffRoles.retired,
      guildCfg.staffRoles.management
    ].filter(Boolean);
  }

  if (!ladder.length) return false;
  const required = new Set(ladder.slice(minRankIndex));
  return member.roles.cache.some(r => required.has(r.id));
}

module.exports = { hasRequiredRank };