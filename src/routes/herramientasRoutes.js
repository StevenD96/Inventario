import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import { soloAdmin } from "../middleware/rolesMiddleware.js";

import {
  listarHerramientas,
  crearHerramienta,
  editarHerramienta,
  eliminarHerramienta
} from "../controllers/herramientasController.js";

const router = express.Router();

router.get("/", verificarSesion, soloAdmin, listarHerramientas);
router.post("/crear", verificarSesion, soloAdmin, crearHerramienta);
router.post("/editar/:id_herramienta", verificarSesion, soloAdmin, editarHerramienta);
router.post("/eliminar", verificarSesion, soloAdmin, eliminarHerramienta);

export default router;
