import pool from "../models/db.js";
import { registrarBitacora } from "../utils/bitacora.js";

const PAGE_SIZE = 10;

// =========================
// LISTAR
// =========================
export const listarTuberia = async (req, res) => {
  try {
    const usuarioSesion = req.session.usuario;
    if (!usuarioSesion) return res.redirect("/");

    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

    const [result] = await pool.query("CALL sp_tuberia_listar(?, ?, ?)", [
      q,
      PAGE_SIZE,
      offset,
    ]);

    const total = result[0][0].total;
    const tuberias = result[1];

    // ▶ Registrar consulta en bitácora
    registrarBitacora(req, "Tubería", "CONSULTAR", "El usuario consultó el listado de tuberías");

    res.render("Tuberia/index", {
      layout: "app",

      usuario: usuarioSesion,
      nombreUsuario: usuarioSesion.nombre_completo,
      rolUsuario: usuarioSesion.rol,

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
    registrarBitacora(req, "Tubería", "ERROR", error.message);
    res.status(500).send("Error interno.");
  }
};


// =========================
// CREAR
// =========================
export const crearTuberia = async (req, res) => {
  try {
    const { descripcion, diametro, especificacion, cantidad } = req.body;

    await pool.query("CALL sp_tuberia_insertar(?,?,?,?)", [
      descripcion,
      diametro,
      especificacion,
      cantidad
    ]);

    registrarBitacora(
      req,
      "Tubería",
      "CREAR",
      `Se creó material: ${descripcion}, diámetro ${diametro}, espec. ${especificacion}, cantidad ${cantidad}`
    );

    res.redirect("/tuberia");

  } catch (error) {
    console.error("Error al crear tubería:", error);
    registrarBitacora(req, "Tubería", "ERROR", error.message);
    res.status(500).send("Error interno.");
  }
};


// =========================
// EDITAR
// =========================
export const editarTuberia = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, diametro, especificacion, cantidad } = req.body;

    await pool.query("CALL sp_tuberia_actualizar(?,?,?,?,?)", [
      id,
      descripcion,
      diametro,
      especificacion,
      cantidad
    ]);

    registrarBitacora(
      req,
      "Tubería",
      "EDITAR",
      `Se editó material ID ${id}: ${descripcion}, ${diametro}, ${especificacion}, cantidad ${cantidad}`
    );

    res.redirect("/tuberia");

  } catch (error) {
    console.error("Error al editar tubería:", error);
    registrarBitacora(req, "Tubería", "ERROR", error.message);
    res.status(500).send("Error interno.");
  }
};


// =========================
// ELIMINAR
// =========================
export const eliminarTuberia = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("CALL sp_tuberia_eliminar(?)", [id]);

    registrarBitacora(
      req,
      "Tubería",
      "ELIMINAR",
      `Se eliminó material ID ${id}`
    );

    res.redirect("/tuberia");

  } catch (error) {
    console.error("Error al eliminar tubería:", error);
    registrarBitacora(req, "Tubería", "ERROR", error.message);
    res.status(500).send("Error interno.");
  }
};
