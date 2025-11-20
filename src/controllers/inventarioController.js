import pool from "../models/db.js";

const PAGE_SIZE = 10;

export const inventarioTuberia = async (req, res) => {
  try {
    const usuario = req.session.usuario;

    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

    // Reutilizamos tu SP actual de Tubería
    const [result] = await pool.query("CALL sp_tuberia_listar(?, ?, ?)", [
      q,
      PAGE_SIZE,
      offset
    ]);

    const total = result[0][0]?.total || 0;
    const items = result[1] || [];

    res.render("inventario/index", {
      layout: "app",
      title: "Inventario - Tubería",

      usuario,
      nombreUsuario: usuario.nombre_completo,
      rolUsuario: usuario.rol,

      // Datos para la vista genérica
      items,
      moduloInventario: "tuberia",

      q,
      page,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
      mostrando: items.length ? Math.min(page * PAGE_SIZE, total) : 0,
      prevPage: Math.max(1, page - 1),
      nextPage: Math.min(Math.ceil(total / PAGE_SIZE), page + 1),
      pages: Array.from({ length: Math.ceil(total / PAGE_SIZE) }, (_, i) => ({
        num: i + 1,
        active: page === i + 1
      })),

      moduloActivo: "Tubería"
    });

  } catch (error) {
    console.error("Error al cargar inventario:", error);
    res.status(500).send("Error interno.");
  }
};

// =====================================
// PROCESAR SOLICITUD (Retirar / Ingresar)
// =====================================
export const procesarSolicitud = async (req, res) => {
  console.log("Solicitud recibida:", req.body);

  // Por ahora no haremos nada real
  // Solo devolvemos éxito temporal
  res.json({ ok: true, mensaje: "Solicitud procesada (modo temporal)" });
};



