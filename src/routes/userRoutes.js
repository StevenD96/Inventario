// src/routes/userRoutes.js
import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import { listarUsuarios } from "../controllers/usersController.js";

const router = express.Router();

// Listado con búsqueda + paginación
router.get("/", verificarSesion, listarUsuarios);

// Endpoints “placeholder” para acciones (se implementarán luego)
router.get("/:id/editar", verificarSesion, (req, res) => res.send("Editar usuario (pendiente)"));
router.get("/:id/eliminar", verificarSesion, (req, res) => res.send("Eliminar usuario (pendiente)"));
router.get("/nuevo", verificarSesion, (req, res) => res.send("Crear usuario (pendiente)"));

export default router;
