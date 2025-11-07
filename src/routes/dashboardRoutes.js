import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import { cerrarSesion } from "../controllers/authController.js";


const router = express.Router();

router.get("/dashboard", verificarSesion, (req, res) => {
  const usuario = req.session.usuario;

  res.render("dashboard", {
    layout: "app",
    title: "Panel Principal",
    usuario, // enviamos el objeto completo
    nombreUsuario: usuario?.nombre_completo,
    rolUsuario: usuario?.rol
  });
});


router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});


export default router;
