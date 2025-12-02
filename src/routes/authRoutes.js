// src/routes/authRoutes.js
import express from "express";
import {
  mostrarLogin,
  procesarLogin,
  cerrarSesion
} from "../controllers/authController.js";

import {
  mostrarCambioClave,
  procesarCambioClave
} from "../controllers/passwordController.js";

import {
  mostrarRecuperar,
  procesarRecuperar,
  procesarVerificarToken
} from "../controllers/recuperarController.js";

const router = express.Router();

// Login
router.get("/", mostrarLogin);
router.post("/login", procesarLogin);

// Cambio de clave
router.get("/cambiar-clave", mostrarCambioClave);
router.post("/cambiar-clave", procesarCambioClave);

// Recuperación
router.get("/recuperar", mostrarRecuperar);
router.post("/recuperar", procesarRecuperar);
router.post("/verificar-token", procesarVerificarToken);

// Cerrar sesión (versión recomendada)
router.get("/logout", cerrarSesion);
// (Si querés mantener la versión POST, lo hablamos, pero no recomiendo duplicarla)

export default router;
