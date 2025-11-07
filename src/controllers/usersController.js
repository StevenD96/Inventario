// src/controllers/usersController.js
import pool from "../models/db.js";

const PAGE_SIZE = 10;

export const listarUsuarios = async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const q = (req.query.q || "").trim();
  const offset = (page - 1) * PAGE_SIZE;

  // filtros de búsqueda en nombre, usuario o correo
  const like = `%${q}%`;
  // Codigo de consulta
  try {
    // total
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM Usuario
       WHERE estado <> 'Inactivo'
         AND ( ? = '' OR nombre_completo LIKE ? OR nombre_usuario LIKE ? OR correo LIKE ? )`,
      [q, like, like, like]
    );

    // datos página
    const [rows] = await pool.query(
      `SELECT id_usuario, nombre_completo, nombre_usuario, correo, rol
       FROM Usuario
       WHERE estado <> 'Inactivo'
         AND ( ? = '' OR nombre_completo LIKE ? OR nombre_usuario LIKE ? OR correo LIKE ? )
       ORDER BY nombre_completo
       LIMIT ? OFFSET ?`,
      [q, like, like, like, PAGE_SIZE, offset]
    );

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push({ num: i, active: i === page });
    }

    res.render("users/index", {
      layout: "app",
      title: "Usuarios",
      usuario: req.session.usuario,        // para el encabezado
      usuarios: rows,
      q,
      page,
      total,
      mostrando: rows.length ? Math.min(page * PAGE_SIZE, total) : 0,
      totalPages,
      prevPage: Math.max(1, page - 1),
      nextPage: Math.min(totalPages, page + 1),
      pages,
      nombreUsuario: req.session.usuario?.nombre_completo || "Usuario",
      rolUsuario: req.session.usuario?.rol || "User"

      
    });
  } catch (err) {
    console.error("Error listando usuarios:", err.message);
    res.status(500).send("Error interno");
  }
};
