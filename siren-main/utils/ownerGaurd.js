// utils/ownerGuard.js
module.exports = function isOwner(userId) {
  return userId === process.env.OWNER_ID;
};