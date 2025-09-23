// utils/checkCommandAccess.js
import GuildConfig from "../models/GuildConfig.js";

export async function checkCommandAccess(cmdName, message) {
  const cfg = await GuildConfig.findOne({ guildId: message.guild.id }).lean();
  const cmdCfg = cfg?.commandSettings?.get(cmdName);
  if (!cmdCfg) return true; // no restriction set
  if (cmdCfg.enabled === false) return false;
  if (cmdCfg.roles?.length) {
    return cmdCfg.roles.some(rid => message.member.roles.cache.has(rid));
  }
  return true;
}