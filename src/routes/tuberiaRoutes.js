import { Router } from "express";
import {
  listarTuberia,
  crearTuberia,
  editarTuberia,
  eliminarTuberia
} from "../controllers/tuberiaController.js";

import { verificarSesion } from "../middleware/authMiddleware.js";
import { soloAdmin } from "../middleware/rolesMiddleware.js"; //rol de admin



const router = Router();

router.get("/", verificarSesion, soloAdmin, listarTuberia);
router.post("/crear", verificarSesion, soloAdmin, crearTuberia);
//router.post("/editar", verificarSesion, soloAdmin, editarTuberia);
router.post("/editar/:id", verificarSesion, soloAdmin, editarTuberia);
router.post("/eliminar", verificarSesion, soloAdmin, eliminarTuberia); 


export default router;

