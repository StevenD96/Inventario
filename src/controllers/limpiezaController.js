import pool from "../models/db.js";
import { registrarBitacora } from "../utils/bitacora.js";

const PAGE_SIZE = 10;

// =====================================
//  LISTAR LIMPIEZA (con SP)
// =====================================