// src/routes/dashboardRoutes.js
import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import { cerrarSesion } from "../controllers/authController.js";

const router = express.Router();

// Ruta principal del dashboard
router.get("/", verificarSesion, (req, res) => {
  const usuario = req.session.usuario;

  res.render("dashboard", {
    layout: "app",
    title: "Panel Principal",
    usuario,
    nombreUsuario: usuario?.nombre_completo,
    rolUsuario: usuario?.rol
  });
});

// Cerrar sesión
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

export default router;
