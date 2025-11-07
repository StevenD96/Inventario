export function verificarSesion(req, res, next) {
  if (req.session && req.session.usuario) {
    return next();
  }
  return res.redirect("/");
}
