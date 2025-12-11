import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import { soloAdmin } from "../middleware/rolesMiddleware.js";

import {
  listarCloro,
  crearCloro,
  editarCloro,
  eliminarCloro
} from "../controllers/cloroController.js";

const router = express.Router();

router.get("/", verificarSesion, soloAdmin, listarCloro);
router.post("/crear", verificarSesion, soloAdmin, crearCloro);
router.post("/editar/:id_cloro", verificarSesion, soloAdmin, editarCloro);
router.post("/eliminar", verificarSesion, soloAdmin, eliminarCloro);

export default router;
