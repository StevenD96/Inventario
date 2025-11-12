// src/routes/authRoutes.js
import express from "express";
import { mostrarLogin, procesarLogin } from "../controllers/authController.js"; //importamos el controlador
import { mostrarCambioClave, procesarCambioClave } from "../controllers/passwordController.js";
import { cerrarSesion } from "../controllers/authController.js";


import {
  mostrarRecuperar,
  procesarRecuperar,
  procesarVerificarToken
} from "../controllers/recuperarController.js";



const router = express.Router();

// Página inicial (muestra la vista de login)
router.get("/", mostrarLogin);
router.post("/login", procesarLogin);
router.get("/cambiar-clave", mostrarCambioClave);
router.post("/cambiar-clave", procesarCambioClave);

//Recuperacion y token
router.get("/recuperar", mostrarRecuperar);
router.post("/recuperar", procesarRecuperar);
router.post("/verificar-token", procesarVerificarToken);
// Cerrar sesión
router.post("/logout", cerrarSesion);



export default router;
