import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import { soloAdmin } from "../middleware/rolesMiddleware.js";

import {
  listarLimpieza,
  crearLimpieza,
  editarLimpieza,
  eliminarLimpieza
} from "../controllers/limpiezaController.js";

const router = express.Router();

// Rutas de mantenimiento
router.get("/", verificarSesion, soloAdmin, listarLimpieza);
router.post("/crear", verificarSesion, soloAdmin, crearLimpieza);
router.post("/editar/:id_limpieza", verificarSesion, soloAdmin, editarLimpieza);
router.post("/eliminar", verificarSesion, soloAdmin, eliminarLimpieza);

export default router;

