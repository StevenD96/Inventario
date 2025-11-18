// src/routes/bitacoraRoutes.js
import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import { soloAdmin } from "../middleware/rolesMiddleware.js";
import { listarBitacora } from "../controllers/bitacoraController.js";

const router = express.Router();

// Listado real de bitácora con filtros
router.get("/", verificarSesion, soloAdmin, listarBitacora);

export default router;
