import pool from "../models/db.js";
import { registrarBitacora } from "../utils/bitacora.js";

const PAGE_SIZE = 10;

// =====================================
//  LISTAR LIMPIEZA (con SP)
// =====================================
export const listarLimpieza = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

    const [result] = await pool.query("CALL sp_limpieza_listar(?, ?, ?)", [
      q,
      PAGE_SIZE,
      offset
    ]);

    const total = result[0][0]?.total || 0;
    const limpieza = result[1] || [];

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const pages = Array.from({ length: totalPages }, (_, i) => ({
      num: i + 1,
      active: page === i + 1
    }));

    await registrarBitacora(
      req,
      "Limpieza",
      "CONSULTAR",
      "El usuario consultó el listado de limpieza."
    );

    res.render("Limpieza/index", { //corregir letra
      layout: "app",
      title: "Limpieza",
      usuario,
      nombreUsuario: usuario.nombre_completo,
      rolUsuario: usuario.rol,
      moduloActivo: "Limpieza",
      moduloInventario: null,
      limpieza,
      q,
      page,
      total,
      mostrando: limpieza.length ? Math.min(page * PAGE_SIZE, total) : 0,
      totalPages,
      pages,
      prevPage: Math.max(1, page - 1),
      nextPage: Math.min(totalPages, page + 1),
      add: req.query.add,
      edit: req.query.edit,
      delete: req.query.delete,
      existe: req.query.existe,
      error: req.query.error
    });
  } catch (err) {
    console.error("Error listando limpieza:", err);
    await registrarBitacora(req, "Limpieza", "ERROR", err.message);
    res.status(500).send("Error interno al listar limpieza.");
  }
};

// =====================================
//  CREAR LIMPIEZA
// =====================================
export const crearLimpieza = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const { descripcion, cantidad } = req.body;
    const desc = descripcion.trim();
    const cantInt = parseInt(cantidad, 10) || 0;

    // 🔎 VALIDAR DUPLICADO (solo por descripción)
    const [dup] = await pool.query(
      `SELECT id_limpieza
       FROM limpieza
       WHERE descripcion = ?
         AND estado <> 'Inactivo'
       LIMIT 1`,
      [desc]
    );

    if (dup.length) {
      return res.redirect("/limpieza?existe=1");
    }

    // ➕ INSERTAR
    await pool.query(
      `INSERT INTO limpieza (descripcion, cantidad, estado)
       VALUES (?, ?, 'Activo')`,
      [desc, cantInt]
    );

    //BITÁCORA
    //const cantIntTexto = cantInt ? `, Cantidad ${cantInt}` : "";

    await registrarBitacora(
      req,
      "Limpieza",
      "CREAR",
      `Se creó material: ${desc}.`
    );

    res.redirect("/limpieza?add=1");

  } catch (err) {
    console.error("Error creando limpieza:", err);
    await registrarBitacora(req, "Limpieza", "ERROR", err.message);
    res.redirect("/limpieza?error=1");
  }
};

// =====================================
//  EDITAR LIMPIEZA
// =====================================
export const editarLimpieza = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const id_limpieza = req.params.id_limpieza || req.body.id_limpieza;
    const { descripcion, cantidad } = req.body;

    const descNueva = descripcion.trim();
    const cantNueva = parseInt(cantidad, 10) || 0;

    const [[actual]] = await pool.query(
      `SELECT descripcion, cantidad
       FROM limpieza
       WHERE id_limpieza = ?`,
      [id_limpieza]
    );

    if (!actual) return res.redirect("/limpieza?error=1");

    await pool.query(
      `UPDATE limpieza
       SET descripcion = ?, cantidad = ?
       WHERE id_limpieza = ?`,
      [descNueva, cantNueva, id_limpieza]
    );

    const cambios = [];

    if (actual.descripcion !== descNueva) {
      cambios.push(`Descripción: ${actual.descripcion} → ${descNueva}`);
    }

    if (Number(actual.cantidad) !== cantNueva) {
      cambios.push(`Cantidad: ${actual.cantidad} → ${cantNueva}`);
    }

    const detalle = cambios.length ? `: ${cambios.join(", ")}` : "";

    await registrarBitacora(
      req,
      "Limpieza",
      "EDITAR",
      `Material ${actual.descripcion} modificado${detalle}.`
    );

    res.redirect("/limpieza?edit=1");

  } catch (err) {
    console.error("Error editando limpieza:", err);
    await registrarBitacora(req, "Limpieza", "ERROR", err.message);
    res.redirect("/limpieza?error=1");
  }
};


// =====================================
//  ELIMINAR LIMPIEZA (estado = Inactivo)
// =====================================
export const eliminarLimpieza = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const { id_limpieza } = req.body;

    const [[row]] = await pool.query(
      `SELECT descripcion FROM limpieza WHERE id_limpieza = ?`,
      [id_limpieza]
    );

    if (!row) return res.redirect("/limpieza?error=1");

    await pool.query(
      `UPDATE limpieza SET estado = 'Inactivo' WHERE id_limpieza = ?`,
      [id_limpieza]
    );

    await registrarBitacora(
      req,
      "Limpieza",
      "ELIMINAR",
      `Material ${row.descripcion} eliminado.`

    );

    res.redirect("/limpieza?delete=1");
  } catch (err) {
    console.error("Error eliminando limpieza:", err);
    await registrarBitacora(req, "Limpieza", "ERROR", err.message);
    res.redirect("/limpieza?error=1");
  }
};
