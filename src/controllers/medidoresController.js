import pool from "../models/db.js";
import { registrarBitacora } from "../utils/bitacora.js";

const PAGE_SIZE = 10;

// ==============================
// LISTAR MEDIDORES
// ==============================
export const listarMedidores = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

    const [result] = await pool.query("CALL sp_medidores_listar(?, ?, ?)", [
      q,
      PAGE_SIZE,
      offset
    ]);

    const total = result[0][0]?.total || 0;
    const medidores = result[1] || [];

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const pages = Array.from({ length: totalPages }, (_, i) => ({
      num: i + 1,
      active: i + 1 === page
    }));

    // Bitácora
    await registrarBitacora(
      req,
      "Medidores",
      "CONSULTAR",
      "El usuario consultó el listado de medidores."
    );

    res.render("Medidores/index", {
      layout: "app",
      title: "Medidores",
      usuario,
      nombreUsuario: usuario.nombre_completo,
      rolUsuario: usuario.rol,

      moduloActivo: "Medidores",
      moduloInventario: null,

      medidores,
      q,
      page,
      total,
      mostrando: medidores.length ? Math.min(page * PAGE_SIZE, total) : 0,
      totalPages,
      pages,
      add: req.query.add,
      edit: req.query.edit,
      delete: req.query.delete,
      existe: req.query.existe,
      error: req.query.error
    });

  } catch (err) {
    console.error("Error listando medidores:", err);
    await registrarBitacora(req, "Medidores", "ERROR", err.message);
    res.status(500).send("Error interno al listar medidores");
  }
};

// ==============================
// CREAR
// ==============================
export const crearMedidor = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const { descripcion, especificacion, cantidad } = req.body;
    const desc = descripcion.trim();
    const espec = (especificacion || "").trim();
    const cantInt = parseInt(cantidad, 10) || 0;

    // Validar duplicado
    const [dup] = await pool.query(
      `SELECT id_medidor
       FROM Medidores
       WHERE descripcion = ?
         AND especificacion = ?
         AND estado <> 'Inactivo'
       LIMIT 1`,
      [desc, espec]
    );

    if (dup.length) {
      return res.redirect("/medidores?existe=1");
    }

    // Insertar
    await pool.query(
      `INSERT INTO Medidores (descripcion, especificacion, cantidad, estado)
       VALUES (?, ?, ?, 'Activo')`,
      [desc, espec, cantInt]
    );

    // Bitácora
    await registrarBitacora(
      req,
      "Medidores",
      "CREAR",
      `Se creó material: ${desc}.`
    );

    res.redirect("/medidores?add=1");

  } catch (err) {
    console.error("Error creando medidor:", err);
    await registrarBitacora(req, "Medidores", "ERROR", err.message);
    res.redirect("/medidores?error=1");
  }
};


// ==============================
// EDITAR
// ==============================
export const editarMedidor = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const id_medidor = req.params.id_medidor || req.body.id_medidor;
    const { descripcion, especificacion, cantidad } = req.body;

    const cantNueva = parseInt(cantidad, 10) || 0;

    const [[actual]] = await pool.query(
      `SELECT descripcion, especificacion, cantidad
       FROM Medidores
       WHERE id_medidor = ?
       LIMIT 1`,
      [id_medidor]
    );

    if (!actual) return res.redirect("/medidores?error=1");

    await pool.query(
      `UPDATE Medidores
       SET descripcion = ?, especificacion = ?, cantidad = ?
       WHERE id_medidor = ?`,
      [descripcion.trim(), (especificacion || "").trim(), cantNueva, id_medidor]
    );

    const cambios = [];
    if (actual.descripcion !== descripcion.trim())
      cambios.push(`Descripción: "${actual.descripcion}" → "${descripcion.trim()}"`);

    const especA = actual.especificacion || "";
    const especN = (especificacion || "").trim();
    if (especA !== especN)
      cambios.push(`Especificación "${especA}" → "${especN}"`);

    if (actual.cantidad !== cantNueva)
      cambios.push(`Cantidad: ${actual.cantidad} → ${cantNueva}`);

    await registrarBitacora(
      req,
      "Medidores",
      "EDITAR",
      `Material ${descripcion.trim()} modificado: ${cambios.join(", ")}.`
    );

    res.redirect("/medidores?edit=1");

  } catch (err) {
    console.error("Error editando medidor:", err);
    await registrarBitacora(req, "Medidores", "ERROR", err.message);
    res.redirect("/medidores?error=1");
  }
};

// ==============================
// ELIMINAR
// ==============================
export const eliminarMedidor = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const { id_medidor } = req.body;

    const [[row]] = await pool.query(
      `SELECT descripcion
       FROM Medidores
       WHERE id_medidor = ?
       LIMIT 1`,
      [id_medidor]
    );

    if (!row) return res.redirect("/medidores?error=1");

    await pool.query(
      `UPDATE Medidores
       SET estado = 'Inactivo'
       WHERE id_medidor = ?`,
      [id_medidor]
    );

    await registrarBitacora(
      req,
      "Medidores",
      "ELIMINAR",
      `Material ${row.descripcion} eliminado.`
    );

    res.redirect("/medidores?delete=1");

  } catch (err) {
    console.error("Error eliminando medidor:", err);
    await registrarBitacora(req, "Medidores", "ERROR", err.message);
    res.redirect("/medidores?error=1");
  }
};
