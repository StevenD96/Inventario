export const soloAdmin = (req, res, next) => {
  if (req.session?.usuario?.rol === "Admin") {
    return next();
  }

  return res.status(403).send("Acceso denegado.");
};
