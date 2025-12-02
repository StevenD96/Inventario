import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import { soloAdmin } from "../middleware/rolesMiddleware.js";
import {
  listarBitacora,
  exportarBitacoraExcel,
  exportarBitacoraPdf, eliminarBitacoraFiltrada

} from "../controllers/bitacoraController.js";

const router = express.Router();

router.get("/", verificarSesion, soloAdmin, listarBitacora);
router.get("/export/excel", verificarSesion, soloAdmin, exportarBitacoraExcel);
router.get("/export/pdf", verificarSesion, soloAdmin, exportarBitacoraPdf);
router.post("/eliminar", verificarSesion, soloAdmin, eliminarBitacoraFiltrada);


export default router;



