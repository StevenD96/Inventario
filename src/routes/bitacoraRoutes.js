// src/routes/bitacoraRoutes.js
import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import { soloAdmin } from "../middleware/rolesMiddleware.js";

const router = express.Router();

// Vista inicial de bitácora (sin filtros todavía)
router.get("/", verificarSesion, soloAdmin, (req, res) => {

  const usuario = req.session.usuario; //NECESARIO para que el layout funcione

  res.render("bitacora/index", {
    layout: "app",
    title: "Bitácora del Sistema",

    //Variables de sesión necesarias para el header
    usuario,
    nombreUsuario: usuario?.nombre_completo || "Usuario",
    rolUsuario: usuario?.rol || "User",

    // Datos iniciales (sin funcionalidad aún)
    registros: [],
    usuarios: [],
    modulo: "",
    mes: "",
    anio: "",
    page: 1,
    total: 0,
    mostrando: 0,
    totalPages: 1,
    pages: []
  });
});

export default router;
