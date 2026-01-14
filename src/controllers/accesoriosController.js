import pool from "../models/db.js";
import { registrarBitacora } from "../utils/bitacora.js";

const PAGE_SIZE = 10;

// ======================================================
// LISTAR ACCESORIOS
// ======================================================
export const listarAccesorios = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

    // === LLAMAR SP ===
    const [result] = await pool.query("CALL sp_accesorios_listar(?, ?, ?)", [
      q,
      PAGE_SIZE,
      offset
    ]);

    const total = result[0][0]?.total || 0;
    const rows = result[1] || [];

    // === PAGINACIÓN ===
    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const pages = Array.from({ length: totalPages }, (_, i) => ({
      num: i + 1,
      active: i + 1 === page
    }));

    // === BITÁCORA ===
    await registrarBitacora(
      req,
      "Accesorios",
      "CONSULTAR",
      "El usuario consultó el listado de accesorios."
    );

    // === RENDER ===
    res.render("Accesorios/index", {
      layout: "app",
      title: "Accesorios",
      usuario,
      nombreUsuario: usuario.nombre_completo,
      rolUsuario: usuario.rol,
      moduloActivo: "Accesorios",

      accesorios: rows,
      q,
      page,
      total,
      mostrando: rows.length ? Math.min(page * PAGE_SIZE, total) : 0,
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
    console.error("Error listando accesorios:", err);
    await registrarBitacora(
      req,
      "Accesorios",
      "ERROR",
      err.message
    );
    res.status(500).send("Error interno al listar accesorios.");
  }
};


// ======================================================
// CREAR ACCESORIO
// ======================================================

export const crearAccesorio = async (req, res) => {
  const usuario = req.session.usuario;

  try {
    const { descripcion, tipo, diametro, especificacion, cantidad } = req.body;

    // Validar duplicado
    const [dup] = await pool.query(
      `SELECT id_accesorio FROM accesorios 
       WHERE descripcion = ? AND tipo = ? AND diametro = ? AND especificacion = ? 
       AND estado <> 'Inactivo' LIMIT 1`,
      [descripcion, tipo, diametro, especificacion]
    );

    if (dup.length) {
      return res.redirect("/accesorios?existe=1");
    }

    // Insertar
    await pool.query(
      `INSERT INTO accesorios (descripcion, tipo, diametro, especificacion, cantidad)
       VALUES (?, ?, ?, ?, ?)`,
      [descripcion, tipo, diametro, especificacion, cantidad]
    );

    /*await registrarBitacora(
      req,
      "Accesorios",
      "CREAR",
      `Se registró accesorio: ${descripcion} (${tipo})`
    );*/

    await registrarBitacora(
    req,
    "Accesorios",
    "CREAR",
    `Se creó material: ${descripcion}, Tipo ${tipo}, Diámetro ${diametro}, Especificación ${especificacion}, Cantidad ${cantidad}.`
    );


    res.redirect("/accesorios?add=1");

  } catch (err) {
    console.error("Error creando accesorio:", err);
    await registrarBitacora(
      req,
      "Accesorios",
      "ERROR",
      err.message
    );
    res.redirect("/accesorios?error=1");
  }
};

// ======================================================
// EDITAR ACCESORIO
// ======================================================
export const editarAccesorio = async (req, res) => {
  const usuario = req.session.usuario;
  if (!usuario) return res.redirect("/");

  try {
    const { id_accesorio, descripcion, tipo, diametro, especificacion, cantidad } = req.body;

    // Obtener valores actuales
    const [[actual]] = await pool.query(
      "SELECT descripcion, tipo, diametro, especificacion, cantidad FROM accesorios WHERE id_accesorio = ?",
      [id_accesorio]
    );

    if (!actual) throw new Error("Accesorio no encontrado");

    // Actualizar
    await pool.query(
      `UPDATE accesorios 
       SET descripcion = ?, tipo = ?, diametro = ?, especificacion = ?, cantidad = ?
       WHERE id_accesorio = ?`,
      [descripcion, tipo, diametro, especificacion, cantidad, id_accesorio]
    );

    // Detectar cambios
    const cambios = [];

    if (actual.descripcion !== descripcion)
      cambios.push(`Descripción: "${actual.descripcion}" → "${descripcion}"`);

    if (actual.tipo !== tipo)
      cambios.push(`Tipo: "${actual.tipo}" → "${tipo}"`);

    if (actual.diametro !== diametro)
      cambios.push(`Diámetro: ${actual.diametro} → ${diametro}`);

    if (actual.especificacion !== especificacion)
      cambios.push(`Especificación "${actual.especificacion}" → "${especificacion}"`);

    if (Number(actual.cantidad) !== Number(cantidad))
      cambios.push(`Cantidad: ${actual.cantidad} → ${cantidad}`);

    const textoCambios =
      cambios.length > 0 ? cambios.join(", ") : "Sin cambios detectados";

    // Registrar bitácora con EXACTO formato solicitado
    await registrarBitacora(
      req,
      "Accesorios",
      "EDITAR",
      `Material ${descripcion}, Diámetro ${diametro} modificado: ${textoCambios}.`
    );

    return res.redirect("/accesorios?edit=1");

  } catch (err) {
    console.error("Error editando accesorio:", err);

    await registrarBitacora(
      req,
      "Accesorios",
      "ERROR",
      `Error al editar accesorio: ${err.message}`
    );

    return res.redirect("/accesorios?error=1");
  }
};


// ======================================================
// ELIMINAR ACCESORIO
// ======================================================
export const eliminarAccesorio = async (req, res) => {
  try {
    const { id_accesorio } = req.body;

    // Obtener datos del accesorio para bitácora
    const [[row]] = await pool.query(
      `SELECT descripcion, diametro 
       FROM Accesorios 
       WHERE id_accesorio = ? 
       LIMIT 1`,
      [id_accesorio]
    );

    if (!row) return res.redirect("/accesorios?error=1");

    // Marcar como Inactivo
    await pool.query(
      `UPDATE Accesorios 
       SET estado = 'Inactivo' 
       WHERE id_accesorio = ?`,
      [id_accesorio]
    );

    // Registrar bitácora con el formato solicitado
    await registrarBitacora(
      req,
      "Accesorios",
      "ELIMINAR",
      `Material ${row.descripcion}, Diámetro ${row.diametro} eliminado.`
    );

    res.redirect("/accesorios?delete=1");

  } catch (err) {
    console.error("Error eliminando accesorio:", err);

    await registrarBitacora(
      req,
      "Accesorios",
      "ERROR",
      err.message
    );

    res.redirect("/accesorios?error=1");
  }
};

