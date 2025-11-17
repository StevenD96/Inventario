// src/routes/userRoutes.js
import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import { soloAdmin } from "../middleware/rolesMiddleware.js";

import { listarUsuarios, crearUsuario } from "../controllers/usersController.js";

const router = express.Router();

// Listado con búsqueda + paginación
router.get("/", verificarSesion, soloAdmin, listarUsuarios);

// Crear nuevo usuario (desde el modal)
router.post("/nuevo", verificarSesion, soloAdmin, crearUsuario);

// Endpoints “placeholder” para acciones futuras
router.get("/:id/editar", verificarSesion, (req, res) => res.send("Editar usuario (pendiente)"));
router.get("/:id/eliminar", verificarSesion, (req, res) => res.send("Eliminar usuario (pendiente)"));

export default router;
