import { Router } from "express";
import {
  listarTuberia,
  crearTuberia,
  editarTuberia,
  eliminarTuberia
} from "../controllers/tuberiaController.js";

import { verificarSesion } from "../middleware/authMiddleware.js";


const router = Router();


// 🔒 TODAS LAS RUTAS DEBEN ESTAR PROTEGIDAS
router.get("/", verificarSesion, listarTuberia);
router.post("/crear", verificarSesion, crearTuberia);
router.post("/editar/:id", verificarSesion, editarTuberia);
router.post("/eliminar/:id", verificarSesion, eliminarTuberia);

export default router;

