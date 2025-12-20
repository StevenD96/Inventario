import pool from "../models/db.js";
import { registrarBitacora } from "../utils/bitacora.js";

const PAGE_SIZE = 10;

/* =====================================
   LISTAR CLORO
===================================== */
export const listarCloro = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

    const [result] = await pool.query("CALL sp_cloro_listar(?, ?, ?)", [
      q,
      PAGE_SIZE,
      offset
    ]);

    const total = result[0][0]?.total || 0;
    const rows  = result[1] || [];

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const pages = Array.from({ length: totalPages }, (_, i) => ({
      num: i + 1,
      active: page === i + 1
    }));

    await registrarBitacora(
      req,
      "Cloro",
      "CONSULTAR",
      "El usuario consultó el listado de cloro."
    );

    res.render("Cloro/index", {
      layout: "app",
      title: "Cloro",
      usuario,
      nombreUsuario: usuario.nombre_completo,
      rolUsuario: usuario.rol,
      moduloActivo: "Cloro",
      moduloInventario: null,
      cloro: rows,
      q,
      page,
      total,
      mostrando: rows.length ? Math.min(page * PAGE_SIZE, total) : 0,
      totalPages,
      pages,
      add: req.query.add,
      edit: req.query.edit,
      delete: req.query.delete,
      existe: req.query.existe,
      error: req.query.error
    });

  } catch (err) {
    console.error("Error listando cloro:", err);
    await registrarBitacora(req, "Cloro", "ERROR", err.message);
    res.status(500).send("Error interno al listar cloro.");
  }
};


/* =====================================
   CREAR CLORO
===================================== */
export const crearCloro = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const { descripcion, especificacion, cantidad } = req.body;
    const desc = descripcion.trim();
    const espec = (especificacion || "").trim();
    const cantInt = parseInt(cantidad, 10) || 0;

    //VALIDAR DUPLICADO (MISMO PATRÓN QUE ACCESORIOS)
    const [dup] = await pool.query(
      `SELECT id_cloro 
       FROM Cloro 
       WHERE descripcion = ? 
         AND especificacion = ?
         AND estado <> 'Inactivo'
       LIMIT 1`,
      [desc, espec]
    );

    if (dup.length) {
      return res.redirect("/cloro?existe=1");
    }

    //INSERTAR
    await pool.query(
      `INSERT INTO Cloro (descripcion, especificacion, cantidad, estado)
       VALUES (?, ?, ?, 'Activo')`,
      [desc, espec, cantInt]
    );

    // BITÁCORA
    const especTexto = espec ? `, Especificación ${espec}` : "";

    await registrarBitacora(
      req,
      "Cloro",
      "CREAR",
      `Se creó material: ${desc}${especTexto}.`
    );

    res.redirect("/cloro?add=1");

  } catch (err) {
    console.error("Error creando cloro:", err);
    await registrarBitacora(req, "Cloro", "ERROR", err.message);
    res.redirect("/cloro?error=1");
  }
};

/* =====================================
   EDITAR CLORO
===================================== */
export const editarCloro = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const id_cloro = req.params.id_cloro || req.body.id_cloro;
    const { descripcion, especificacion, cantidad } = req.body;

    const cantNueva = parseInt(cantidad, 10) || 0;

    const [[actual]] = await pool.query(
      `SELECT descripcion, especificacion, cantidad
       FROM Cloro
       WHERE id_cloro = ?
       LIMIT 1`,
      [id_cloro]
    );

    if (!actual) return res.redirect("/cloro?error=1");

    await pool.query(
      `UPDATE Cloro SET descripcion=?, especificacion=?, cantidad=? WHERE id_cloro=?`,
      [
        descripcion.trim(),
        (especificacion || "").trim(),
        cantNueva,
        id_cloro
      ]
    );

    // Cambios detectados
    const cambios = [];

    if (actual.descripcion !== descripcion.trim())
      cambios.push(`Descripción: "${actual.descripcion}" → "${descripcion.trim()}"`);

    const especActual = actual.especificacion || "";
    const especNueva  = (especificacion || "").trim();
    if (especActual !== especNueva)
      cambios.push(`Especificación "${especActual || "-"}" → "${especNueva || "-"}"`);

    if (actual.cantidad !== cantNueva)
      cambios.push(`Cantidad: ${actual.cantidad} → ${cantNueva}`);

    const detalleCambios = cambios.length ? cambios.join(", ") : "Sin cambios relevantes";

    await registrarBitacora(
      req,
      "Cloro",
      "EDITAR",
      `Material ${descripcion.trim()} modificado: ${detalleCambios}`
    );

    res.redirect("/cloro?edit=1");

  } catch (err) {
    console.error("Error editando cloro:", err);
    await registrarBitacora(req, "Cloro", "ERROR", err.message);
    res.redirect("/cloro?error=1");
  }
};

/* =====================================
   ELIMINAR (estado = Inactivo)
===================================== */
export const eliminarCloro = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const { id_cloro } = req.body;

    const [[row]] = await pool.query(
      `SELECT descripcion, especificacion FROM Cloro WHERE id_cloro=? LIMIT 1`,
      [id_cloro]
    );

    if (!row) return res.redirect("/cloro?error=1");

    await pool.query(`UPDATE Cloro SET estado='Inactivo' WHERE id_cloro=?`, [
      id_cloro
    ]);

    const especTexto = row.especificacion ? `, Especificación ${row.especificacion}` : "";

    await registrarBitacora(
      req,
      "Cloro",
      "ELIMINAR",
      `Material ${row.descripcion}${especTexto} eliminado.`
    );

    res.redirect("/cloro?delete=1");

  } catch (err) {
    console.error("Error eliminando cloro:", err);
    await registrarBitacora(req, "Cloro", "ERROR", err.message);
    res.redirect("/cloro?error=1");
  }
};
