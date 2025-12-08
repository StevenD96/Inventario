import pool from "../models/db.js";
import { registrarBitacora } from "../utils/bitacora.js";

const PAGE_SIZE = 10;

// =====================================
//  LISTAR PEGAMENTOS (con SP)
// =====================================
export const listarPegamentos = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

    // Llamamos al SP
    const [result] = await pool.query("CALL sp_pegamentos_listar(?, ?, ?)", [
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

    // Bitácora: consulta
    await registrarBitacora(
      req,
      "Pegamentos",
      "CONSULTAR",
      "El usuario consultó el listado de pegamentos"
    );

    res.render("Pegamentos/index", {
      layout: "app",
      title: "Pegamentos",
      usuario,
      nombreUsuario: usuario.nombre_completo,
      rolUsuario: usuario.rol,
      moduloActivo: "Pegamentos",
      moduloInventario: null,     // Para evitar activar el menú de Inventario/ Pegamentos
      pegamentos: rows,
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
    console.error("Error listando pegamentos:", err);
    await registrarBitacora(
      req,
      "Pegamentos",
      "ERROR",
      err.message
    );
    res.status(500).send("Error interno al listar pegamentos.");
  }
};

// =====================================
//  CREAR PEGAMENTO
// =====================================
export const crearPegamento = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const { descripcion, especificacion, cantidad } = req.body;

    const cantInt = parseInt(cantidad, 10) || 0;

    await pool.query(
      `INSERT INTO Pegamentos (descripcion, especificacion, cantidad, estado)
       VALUES (?, ?, ?, 'Activo')`,
      [descripcion.trim(), (especificacion || "").trim(), cantInt]
    );

    // Bitácora: Se creó material: Descripción, espec.
    const especTexto = especificacion
      ? `, espec. ${especificacion.trim()}`
      : "";

    await registrarBitacora(
      req,
      "Pegamentos",
      "CREAR",
      `Se creó material: ${descripcion.trim()}${especTexto}`
    );

    res.redirect("/pegamentos?add=1");

  } catch (err) {
    console.error("Error creando pegamento:", err);
    await registrarBitacora(
      req,
      "Pegamentos",
      "ERROR",
      err.message
    );
    res.redirect("/pegamentos?error=1");
  }
};

// =====================================
//  EDITAR PEGAMENTO
// =====================================
export const editarPegamento = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const id_pegamento = req.params.id_pegamento || req.body.id_pegamento;
    const { descripcion, especificacion, cantidad } = req.body;

    const cantNueva = parseInt(cantidad, 10) || 0;

    // 1. Traer valores actuales
    const [[actual]] = await pool.query(
      `SELECT descripcion, especificacion, cantidad
       FROM Pegamentos
       WHERE id_pegamento = ?
       LIMIT 1`,
      [id_pegamento]
    );

    if (!actual) {
      return res.redirect("/pegamentos?error=1");
    }

    // 2. Actualizar registro
    await pool.query(
      `UPDATE Pegamentos
       SET descripcion   = ?,
           especificacion = ?,
           cantidad      = ?
       WHERE id_pegamento = ?`,
      [
        descripcion.trim(),
        (especificacion || "").trim(),
        cantNueva,
        id_pegamento
      ]
    );

    // 3. Armar descripción de cambios
    const cambios = [];

    if (actual.descripcion !== descripcion.trim()) {
      cambios.push(
        `Descripción: "${actual.descripcion}" → "${descripcion.trim()}"`
      );
    }

    const especActual = actual.especificacion || "";
    const especNueva  = (especificacion || "").trim();
    if (especActual !== especNueva) {
      cambios.push(
        `Espec.: "${especActual || "-"}" → "${especNueva || "-"}"`
      );
    }

    if (actual.cantidad !== cantNueva) {
      cambios.push(`Cantidad: ${actual.cantidad} → ${cantNueva}`);
    }

    let detalleCambios = "";
    if (cambios.length > 0) {
      detalleCambios = cambios.join(", ");
    } else {
      detalleCambios = "Sin cambios relevantes";
    }

    // 4. Bitácora: Material descripción: Cantidad: 35 → 40 (todos los cambios)
    await registrarBitacora(
      req,
      "Pegamentos",
      "EDITAR",
      `Material ${descripcion.trim()}: ${detalleCambios}`
    );

    res.redirect("/pegamentos?edit=1");

  } catch (err) {
    console.error("Error editando pegamento:", err);
    await registrarBitacora(
      req,
      "Pegamentos",
      "ERROR",
      err.message
    );
    res.redirect("/pegamentos?error=1");
  }
};

// =====================================
//  ELIMINAR PEGAMENTO (Estado = Inactivo)
// =====================================
export const eliminarPegamento = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const { id_pegamento } = req.body;

    const [[row]] = await pool.query(
      `SELECT descripcion, especificacion
       FROM Pegamentos
       WHERE id_pegamento = ?
       LIMIT 1`,
      [id_pegamento]
    );

    if (!row) {
      return res.redirect("/pegamentos?error=1");
    }

    await pool.query(
      `UPDATE Pegamentos
       SET estado = 'Inactivo'
       WHERE id_pegamento = ?`,
      [id_pegamento]
    );

    const especTexto = row.especificacion
      ? `, especi. ${row.especificacion}`
      : "";

    // Bitácora: Material Descripción, especi. eliminado.
    await registrarBitacora(
      req,
      "Pegamentos",
      "ELIMINAR",
      `Material ${row.descripcion}${especTexto} eliminado.`
    );

    res.redirect("/pegamentos?delete=1");

  } catch (err) {
    console.error("Error eliminando pegamento:", err);
    await registrarBitacora(
      req,
      "Pegamentos",
      "ERROR",
      err.message
    );
    res.redirect("/pegamentos?error=1");
  }
};
