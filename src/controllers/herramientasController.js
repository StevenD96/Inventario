import pool from "../models/db.js";
import { registrarBitacora } from "../utils/bitacora.js";

const PAGE_SIZE = 10;

// =====================================
//  LISTAR HERRAMIENTAS (con SP)
// =====================================
export const listarHerramientas = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

    const [result] = await pool.query("CALL sp_herramientas_listar(?, ?, ?)", [
      q,
      PAGE_SIZE,
      offset
    ]);

    const total = result[0][0]?.total || 0;
    const rows  = result[1] || [];

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const pages = Array.from({ length: totalPages }, (_, i) => ({
      num: i + 1,
      active: i + 1 === page
    }));

    await registrarBitacora(
      req,
      "Herramientas",
      "CONSULTAR",
      "El usuario consultó el listado de herramientas"
    );

    res.render("Herramientas/index", {
      layout: "app",
      title: "Herramientas",
      usuario,
      nombreUsuario: usuario.nombre_completo,
      rolUsuario: usuario.rol,
      moduloActivo: "Herramientas",
      moduloInventario: null,

      herramientas: rows,
      q,
      page,
      total,
      mostrando: rows.length ? Math.min(page * PAGE_SIZE, total) : 0,
      totalPages,
      pages,
      prevPage: Math.max(1, page - 1),
      nextPage: Math.min(totalPages, page + 1),

      add:    req.query.add,
      edit:   req.query.edit,
      delete: req.query.delete,
      error:  req.query.error
    });

  } catch (err) {
    console.error("Error listando herramientas:", err);
    await registrarBitacora(req, "Herramientas", "ERROR", err.message);
    res.status(500).send("Error interno al listar herramientas.");
  }
};

// =====================================
//  CREAR HERRAMIENTA
// =====================================
export const crearHerramienta = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const { descripcion, especificacion, cantidad } = req.body;
    const cantInt = parseInt(cantidad, 10) || 0;

    await pool.query(
      `INSERT INTO Herramientas (descripcion, especificacion, cantidad, estado)
       VALUES (?, ?, ?, 'Activo')`,
      [descripcion.trim(), (especificacion || "").trim(), cantInt]
    );

    const especTexto = especificacion
      ? `, espec. ${especificacion.trim()}`
      : "";

    await registrarBitacora(
      req,
      "Herramientas",
      "CREAR",
      `Se creó herramienta: ${descripcion.trim()}${especTexto}`
    );

    res.redirect("/herramientas?add=1");

  } catch (err) {
    console.error("Error creando herramienta:", err);
    await registrarBitacora(req, "Herramientas", "ERROR", err.message);
    res.redirect("/herramientas?error=1");
  }
};

// =====================================
//  EDITAR HERRAMIENTA
// =====================================
export const editarHerramienta = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const id_herramienta = req.params.id_herramienta || req.body.id_herramienta;
    const { descripcion, especificacion, cantidad } = req.body;
    const cantNueva = parseInt(cantidad, 10) || 0;

    const [[actual]] = await pool.query(
      `SELECT descripcion, especificacion, cantidad
       FROM Herramientas
       WHERE id_herramienta = ?
       LIMIT 1`,
      [id_herramienta]
    );

    if (!actual) return res.redirect("/herramientas?error=1");

    await pool.query(
      `UPDATE Herramientas
       SET descripcion   = ?, 
           especificacion = ?, 
           cantidad       = ?
       WHERE id_herramienta = ?`,
      [
        descripcion.trim(),
        (especificacion || "").trim(),
        cantNueva,
        id_herramienta
      ]
    );

    const cambios = [];

    if (actual.descripcion !== descripcion.trim()) {
      cambios.push(`Descripción: "${actual.descripcion}" → "${descripcion.trim()}"`);
    }

    const especActual = actual.especificacion || "";
    const especNueva  = (especificacion || "").trim();
    if (especActual !== especNueva) {
      cambios.push(`Espec.: "${especActual || "-"}" → "${especNueva || "-"}"`);
    }

    if (actual.cantidad !== cantNueva) {
      cambios.push(`Cantidad: ${actual.cantidad} → ${cantNueva}`);
    }

    const detalleCambios = cambios.length > 0
      ? cambios.join(", ")
      : "Sin cambios relevantes";

    await registrarBitacora(
      req,
      "Herramientas",
      "EDITAR",
      `Herramienta ${descripcion.trim()}: ${detalleCambios}`
    );

    res.redirect("/herramientas?edit=1");

  } catch (err) {
    console.error("Error editando herramienta:", err);
    await registrarBitacora(req, "Herramientas", "ERROR", err.message);
    res.redirect("/herramientas?error=1");
  }
};

// =====================================
//  ELIMINAR HERRAMIENTA (estado = Inactivo)
// =====================================
export const eliminarHerramienta = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const { id_herramienta } = req.body;

    const [[row]] = await pool.query(
      `SELECT descripcion, especificacion
       FROM Herramientas
       WHERE id_herramienta = ?
       LIMIT 1`,
      [id_herramienta]
    );

    if (!row) return res.redirect("/herramientas?error=1");

    await pool.query(
      `UPDATE Herramientas
       SET estado = 'Inactivo'
       WHERE id_herramienta = ?`,
      [id_herramienta]
    );

    const especTexto = row.especificacion
      ? `, espec. ${row.especificacion}`
      : "";

    await registrarBitacora(
      req,
      "Herramientas",
      "ELIMINAR",
      `Herramienta ${row.descripcion}${especTexto} eliminada.`
    );

    res.redirect("/herramientas?delete=1");

  } catch (err) {
    console.error("Error eliminando herramienta:", err);
    await registrarBitacora(req, "Herramientas", "ERROR", err.message);
    res.redirect("/herramientas?error=1");
  }
};
