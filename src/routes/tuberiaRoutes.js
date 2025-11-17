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


/*TODAS LAS RUTAS DEBEN ESTAR PROTEGIDAS
router.get("/", verificarSesion, listarTuberia);
router.post("/crear", verificarSesion, crearTuberia);
router.post("/editar/:id", verificarSesion, editarTuberia);
router.post("/eliminar/:id", verificarSesion, eliminarTuberia);*/

router.get("/", verificarSesion, soloAdmin, listarTuberia);
router.post("/crear", verificarSesion, soloAdmin, crearTuberia);
router.post("/editar/:id", verificarSesion, soloAdmin, editarTuberia);
router.post("/eliminar/:id", verificarSesion, soloAdmin, eliminarTuberia); 

export default router;

