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
      add: req.query.add,
      existe: req.query.existe,
      delete: req.query.delete,
      edit: req.query.edit,   
      error: req.query.error
    });

  } catch (error) {
    console.error("Error al listar tuberías:", error);
    registrarBitacora(req, "Tubería", "ERROR", error.message);
    res.status(500).send("Error interno.");
  }
};

// =========================
// CREAR TUBERÍA
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

    // Bitácora
    registrarBitacora(
      req,
      "Tubería",
      "CREAR",
      `Se creó material: ${descripcion}, diámetro ${diametro}, espec. ${especificacion}, cantidad ${cantidad}`
    );

    return res.redirect("/tuberia?add=1");

  } catch (error) {
    console.error("Error al crear tubería:", error.message);

    // Duplicado detectado por el SP
    if (error.message.includes("Material ya existe")) {
      return res.redirect("/tuberia?existe=1");
    }

    registrarBitacora(req, "Tubería", "ERROR", error.message);
    return res.redirect("/tuberia?error=1");
  }
};

// =========================
// EDITAR
// =========================
export const editarTuberia = async (req, res) => {
  try {
    const { id_tuberia, descripcion, diametro, especificacion, cantidad } = req.body;
    const id = id_tuberia;

    // Obtener datos actuales para registrar SOLO lo modificado
    const [actual] = await pool.query("SELECT * FROM Tuberia WHERE id_tuberia = ?", [id]);

    await pool.query("CALL sp_tuberia_actualizar(?,?,?,?,?)", [
      id,
      descripcion,
      diametro,
      especificacion,
      cantidad
    ]);

    // Construcción del mensaje de cambios
    let cambios = [];
    if (actual[0].descripcion !== descripcion) cambios.push(`Descripción: ${actual[0].descripcion} → ${descripcion}`);
    if (actual[0].diametro !== diametro) cambios.push(`Diámetro: ${actual[0].diametro} → ${diametro}`);
    if (actual[0].especificacion !== especificacion) cambios.push(`Especificación: ${actual[0].especificacion} → ${especificacion}`);
    if (actual[0].cantidad != cantidad) cambios.push(`Cantidad: ${actual[0].cantidad} → ${cantidad}`);

    registrarBitacora(
      req,
      "Tubería",
      "EDITAR",
      //`Material ID ${id} modificado: ${cambios.join(", ")}`
      `Material diámetro ${actual[0].diametro} modificado: ${cambios.join(", ")}`

    );

    res.redirect("/tuberia?edit=1");

  } catch (error) {
    console.error("Error al editar tubería:", error);
    registrarBitacora(req, "Tubería", "ERROR", error.message);
    res.redirect("/tuberia?error=1");
  }
};


// =========================
// ELIMINAR (INACTIVAR)
// =========================
export const eliminarTuberia = async (req, res) => {
  try {
    const { id_tuberia } = req.body;

    // Obtener datos del material ANTES de inactivarlo
    const [rows] = await pool.query(
      "SELECT diametro FROM Tuberia WHERE id_tuberia = ?",
      [id_tuberia]
    );

    const material = rows[0];

    // Inactivar material
    await pool.query("CALL sp_tuberia_inactivar(?)", [id_tuberia]);

    // Registrar en bitácora con el formato EXACTO que pediste
    registrarBitacora(
      req,
      "Tubería",
      "ELIMINAR",
      `Material diámetro ${material.diametro} eliminado.`
    );

    return res.redirect("/tuberia?delete=1");

  } catch (error) {
    console.error("Error al eliminar tubería:", error);
    registrarBitacora(req, "Tubería", "ERROR", error.message);
    return res.redirect("/tuberia?error=1");
  }
};


