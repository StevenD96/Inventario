import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import { inventarioTuberia, procesarSolicitud } from "../controllers/inventarioController.js";



const router = express.Router();

// 👉 Vista de Inventario de Tubería
router.get("/tuberia", verificarSesion, inventarioTuberia);


// 👉 Procesar solicitudes (Retiro / Ingreso)
router.post("/solicitud", verificarSesion, procesarSolicitud);

export default router;
