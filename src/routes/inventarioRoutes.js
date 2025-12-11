import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import {
  inventarioTuberia,
  procesarSolicitud
} from "../controllers/inventarioController.js";

// Inventario de Accesorios
import { inventarioAccesorios
   } from "../controllers/inventarioController.js";

//Inventario de Pegamentos  
import { inventarioPegamentos } from "../controllers/inventarioController.js";

//Inventario de Cloro
import { inventarioCloro } from "../controllers/inventarioController.js";

//Inventario de Medicamentos
import { inventarioMedidores } from "../controllers/inventarioController.js";

const router = express.Router();

// Inventario de Tubería
router.get("/tuberia", verificarSesion, inventarioTuberia);

//Inventario de Accesorios
router.get("/accesorios", verificarSesion, inventarioAccesorios);

//Inventario de Pegamentos
router.get("/pegamentos", verificarSesion, inventarioPegamentos);

//Inventario de Cloro
router.get("/cloro", verificarSesion, inventarioCloro);

//Inventario de Medidores
router.get("/medidores", verificarSesion, inventarioMedidores);

// Procesar movimientos (Ingreso / Salida) desde el modal
router.post("/solicitud", verificarSesion, procesarSolicitud);

export default router;
