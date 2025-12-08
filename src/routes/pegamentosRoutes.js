import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import { soloAdmin } from "../middleware/rolesMiddleware.js";

import {
  listarPegamentos,
  crearPegamento,
  editarPegamento,
  eliminarPegamento
} from "../controllers/pegamentosController.js";

const router = express.Router();

// LISTAR
router.get("/", verificarSesion, soloAdmin, listarPegamentos);

// CREAR
router.post("/crear", verificarSesion, soloAdmin, crearPegamento);

// EDITAR
router.post("/editar/:id_pegamento", verificarSesion, soloAdmin, editarPegamento);

// ELIMINAR
router.post("/eliminar", verificarSesion, soloAdmin, eliminarPegamento);

export default router;
