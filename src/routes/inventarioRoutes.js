import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import {
  inventarioTuberia,
  procesarSolicitud
} from "../controllers/inventarioController.js";
// Inventario de Accesorios
import { inventarioAccesorios
   } from "../controllers/inventarioController.js";


const router = express.Router();

// Inventario de Tubería
router.get("/tuberia", verificarSesion, inventarioTuberia);

//Inventario de Accesorios
router.get("/accesorios", verificarSesion, inventarioAccesorios);

// Procesar movimientos (Ingreso / Salida) desde el modal
router.post("/solicitud", verificarSesion, procesarSolicitud);

export default router;
