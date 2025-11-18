// src/controllers/bitacoraController.js
import pool from "../models/db.js";

const PAGE_SIZE = 10;

export const listarBitacora = async (req, res) => {
  try {
    const usuarioSesion = req.session.usuario;
    if (!usuarioSesion) {
      return res.redirect("/");
    }

    // Fecha actual para valores por defecto
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1; // 1-12
    const anioActual = ahora.getFullYear();

    // Filtros recibidos por querystring
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const mes = parseInt(req.query.mes || mesActual, 10);
    const anio = parseInt(req.query.anio || anioActual, 10);

    const usuarioFiltro = req.query.usuario
      ? parseInt(req.query.usuario, 10)
      : 0; // 0 = Todos

    const moduloFiltro = req.query.modulo || "Todos";
    const offset = (page - 1) * PAGE_SIZE;

    const p_modulo = moduloFiltro === "Todos" ? "" : moduloFiltro;

    // Llamar al SP de bitácora
    const [result] = await pool.query(
      "CALL sp_bitacora_filtrar(?, ?, ?, ?, ?, ?)",
      [mes, anio, usuarioFiltro, p_modulo, PAGE_SIZE, offset]
    );

    // Por el orden del SP: primero viene el total, luego los registros
    const total = result[0][0]?.total || 0;     // primer SELECT
    const registros = result[1] || [];          // segundo SELECT

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const pages = Array.from({ length: totalPages }, (_, i) => ({
      num: i + 1,
      active: i + 1 === page,
    }));

    // Listado de usuarios para el combo de filtro
    const [usuariosRows] = await pool.query(
      "SELECT id_usuario, nombre_usuario FROM usuario WHERE estado <> 'Inactivo' ORDER BY nombre_usuario"
    );

    // Catálogo de meses
    const meses = [
      { value: 1, name: "Enero" },
      { value: 2, name: "Febrero" },
      { value: 3, name: "Marzo" },
      { value: 4, name: "Abril" },
      { value: 5, name: "Mayo" },
      { value: 6, name: "Junio" },
      { value: 7, name: "Julio" },
      { value: 8, name: "Agosto" },
      { value: 9, name: "Septiembre" },
      { value: 10, name: "Octubre" },
      { value: 11, name: "Noviembre" },
      { value: 12, name: "Diciembre" },
    ];

    // Rango de años (ajústalo si quieres más)
    const anios = [];
    for (let y = anioActual - 1; y <= anioActual + 1; y++) {
      anios.push({ value: y });
    }

    // Módulos disponibles de la bitácora
    const modulos = [
      { value: "Todos", name: "Todos" },
      { value: "Login", name: "Login" },
      { value: "Usuarios", name: "Usuarios" },
      { value: "Tuberia", name: "Tubería" },
      { value: "Inventario", name: "Inventario" },
      { value: "Sistema", name: "Sistema" },
    ];

    res.render("bitacora/index", {
      layout: "app",
      title: "Bitácora del Sistema",

      // Header
      usuario: usuarioSesion,
      nombreUsuario: usuarioSesion.nombre_completo,
      rolUsuario: usuarioSesion.rol,

      // Datos para la vista
      registros,
      usuarios: usuariosRows,
      meses,
      anios,
      modulos,

      filtros: {
        mes,
        anio,
        usuario: usuarioFiltro,
        modulo: moduloFiltro,
      },

      page,
      total,
      mostrando: registros.length ? Math.min(page * PAGE_SIZE, total) : 0,
      totalPages,
      pages,
    });
  } catch (error) {
    console.error("Error al listar bitácora:", error);
    res.status(500).send("Error interno al listar la bitácora.");
  }
};
