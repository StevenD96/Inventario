import pool from "../models/db.js";

const PAGE_SIZE = 10;

export const listarTuberia = async (req, res) => {
  try {
    const usuarioSesion = req.session.usuario;  // 🔥 MOVERLO ARRIBA
    if (!usuarioSesion) return res.redirect("/");

    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

    // Ejecutar SP
    const [result] = await pool.query("CALL sp_tuberia_listar(?, ?, ?)", [
      q,
      PAGE_SIZE,
      offset,
    ]);

    const tuberias = result[0];
    const total = result[1][0]?.total || 0;

    res.render("Tuberia/index", {
      layout: "app",

      // 🔥 HEADER
      usuario: usuarioSesion,
      nombreUsuario: usuarioSesion.nombre_completo,
      rolUsuario: usuarioSesion.rol,

      // TABLA
      tuberias,
      q,
      page,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
      mostrando: tuberias.length ? Math.min(page * PAGE_SIZE, total) : 0,
      prevPage: Math.max(1, page - 1),
      nextPage: Math.min(Math.ceil(total / PAGE_SIZE), page + 1),
      pages: Array.from({ length: Math.ceil(total / PAGE_SIZE) }, (_, i) => ({
        num: i + 1,
        active: page === i + 1,
      })),
    });

  } catch (error) {
    console.error("Error al listar tuberías:", error);
    res.status(500).send("Error interno.");
  }
};

// =========================
// CREAR
// =========================
export const crearTuberia = async (req, res) => {
  try {
    const { nombre, descripcion, diametro, especificacion, categoria, cantidad } = req.body;

    await pool.query("CALL sp_tuberia_insertar(?,?,?,?,?,?)", [
      nombre,
      descripcion,
      diametro,
      especificacion,
      categoria,
      cantidad
    ]);

    res.redirect("/tuberia");
  } catch (error) {
    console.error("Error al crear tubería:", error);
    res.status(500).send("Error interno.");
  }
};

// =========================
// EDITAR
// =========================
export const editarTuberia = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, diametro, especificacion, categoria, cantidad } = req.body;

    await pool.query("CALL sp_tuberia_actualizar(?,?,?,?,?,?,?)", [
      id,
      nombre,
      descripcion,
      diametro,
      especificacion,
      categoria,
      cantidad
    ]);

    res.redirect("/tuberia");
  } catch (error) {
    console.error("Error al editar tubería:", error);
    res.status(500).send("Error interno.");
  }
};

// =========================
// INACTIVAR
// =========================
export const eliminarTuberia = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("CALL sp_tuberia_eliminar(?)", [id]);
    res.redirect("/tuberia");
  } catch (error) {
    console.error("Error al eliminar tubería:", error);
    res.status(500).send("Error interno.");
  }
};
