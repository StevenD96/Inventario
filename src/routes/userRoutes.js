// src/routes/userRoutes.js
import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import { soloAdmin } from "../middleware/rolesMiddleware.js";

import { listarUsuarios, crearUsuario,   obtenerUsuarioPorId,   editarUsuario, eliminarUsuario
} from "../controllers/usersController.js";

const router = express.Router();

// Listado con búsqueda + paginación
router.get("/", verificarSesion, soloAdmin, listarUsuarios);

// Crear nuevo usuario (desde el modal)
router.post("/nuevo", verificarSesion, soloAdmin, crearUsuario);

// Obtener id del usuario (desde el modal)
router.get("/ajax/:id", verificarSesion, soloAdmin, obtenerUsuarioPorId);

//Editar los datos del usuario
router.post("/editar", verificarSesion, soloAdmin, editarUsuario);

//Editar los datos del usuario
router.post("/eliminar", verificarSesion, soloAdmin, eliminarUsuario);


export default router;
