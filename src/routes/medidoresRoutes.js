import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import { soloAdmin } from "../middleware/rolesMiddleware.js";

import {
  listarMedidores,
  crearMedidor,
  editarMedidor,
  eliminarMedidor
} from "../controllers/medidoresController.js";

const router = express.Router();

// LISTAR
router.get("/", verificarSesion, soloAdmin, listarMedidores);

// CREAR
router.post("/crear", verificarSesion, soloAdmin, crearMedidor);

// EDITAR
router.post("/editar/:id_medidor", verificarSesion, soloAdmin, editarMedidor);

// ELIMINAR
router.post("/eliminar", verificarSesion, soloAdmin, eliminarMedidor);

export default router;
