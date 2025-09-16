export function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect("/auth/login");
  next();
}

export function requireGuildManage(req, res, next) {
  if (!req.session.guilds || !req.session.guildsManageable) {
    return res.redirect("/guilds");
  }
  next();
}
