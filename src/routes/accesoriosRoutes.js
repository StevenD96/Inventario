import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import { soloAdmin } from "../middleware/rolesMiddleware.js";

import {
  listarAccesorios,
  crearAccesorio,
  editarAccesorio,
  eliminarAccesorio
} from "../controllers/accesoriosController.js";

const router = express.Router();

// Listado
router.get("/", verificarSesion, soloAdmin, listarAccesorios);

// Crear
router.post("/crear", verificarSesion, soloAdmin, crearAccesorio);

// Editar
router.post("/editar/:id", verificarSesion, soloAdmin, editarAccesorio);

// Eliminar
router.post("/eliminar", verificarSesion, soloAdmin, eliminarAccesorio);

export default router;
