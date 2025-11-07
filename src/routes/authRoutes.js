// src/routes/authRoutes.js
import express from "express";
import { mostrarLogin, procesarLogin } from "../controllers/authController.js"; //importamos el controlador

const router = express.Router();

// Página inicial (muestra la vista de login)
router.get("/", mostrarLogin);
router.post("/login", procesarLogin);


//Ruta para recuperar contraseña
router.get("/forgot", (req, res) => {
  res.render("auth/forgot", { layout: false });
});

export default router;
