import pool from "../models/db.js";
import { registrarBitacora } from "../utils/bitacora.js";

const PAGE_SIZE = 10;

// ======================================================
//   LISTADO DE INVENTARIO (TUBERÍA)
// ======================================================
export const inventarioTuberia = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

    // SP existente
    const [result] = await pool.query("CALL sp_tuberia_listar(?, ?, ?)", [
      q,
      PAGE_SIZE,
      offset
    ]);

    const total = result[0][0]?.total || 0;
    const tuberias = result[1] || [];

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const pages = Array.from({ length: totalPages }, (_, i) => ({
      num: i + 1,
      active: page === i + 1
    }));

    // Convertir a formato genérico
    const items = tuberias.map(t => ({
      id_item: t.id_tuberia,
      descripcion: t.descripcion,
      diametro: t.diametro,
      especificacion: t.especificacion,
      cantidad: t.cantidad,
      categoria: "Tubería" // 👈 esencial
    }));

    // Registrar consulta
    await registrarBitacora(
      req,
      "Inventario",
      "CONSULTAR",
      "El usuario consultó el inventario de tuberías"
    );

    // Construir mensaje si existe en URL
    let mensaje = null;

    if (req.query.msg === "ok") {
      mensaje = { tipo: "success", texto: "Solicitud realizada con éxito" };
    } else if (req.query.msg === "cantidad") {
      mensaje = { tipo: "warning", texto: "La cantidad ingresada no es válida" };
    } else if (req.query.msg === "error") {
      mensaje = { tipo: "danger", texto: "Error al procesar la solicitud" };
    }

    res.render("inventario/index", {
      layout: "app",
      title: "Inventario - Tubería",

      usuario,
      nombreUsuario: usuario.nombre_completo,
      rolUsuario: usuario.rol,

      moduloActivo: "Tubería",
      moduloInventario: "Tubería",

      items,
      q,
      page,
      total,
      mostrando: items.length ? Math.min(page * PAGE_SIZE, total) : 0,
      totalPages,
      pages,
      prevPage: Math.max(1, page - 1),
      nextPage: Math.min(totalPages, page + 1),

      mensaje
    });

  } catch (err) {
    console.error("Error listando inventario de tubería:", err);
    await registrarBitacora(
      req,
      "Inventario",
      "ERROR",
      `Error al listar inventario de tubería: ${err.message}`
    );
    res.status(500).send("Error interno al listar inventario.");
  }
};

// ======================================================
//   PROCESAR SOLICITUD (Ingreso / Salida)
// ======================================================
export const procesarSolicitud = async (req, res) => {
  const usuario = req.session.usuario;
  if (!usuario) return res.redirect("/");

  try {
    const { id_item, tipo, motivo, cantidad, categoria } = req.body;

    const cantidadInt = parseInt(cantidad, 10);
    if (!cantidadInt || cantidadInt <= 0) {
      return res.redirect("/inventario/tuberia?msg=cantidad");
    }

    // Texto adicional para el diámetro (por defecto vacío)
    let diametroTexto = "";

    // SOLO tubería por ahora
    if (categoria === "Tubería") {
      const [[actual]] = await pool.query(
        "SELECT cantidad, diametro FROM Tuberia WHERE id_tuberia = ?",
        [id_item]
      );

      if (!actual) throw new Error("Material no encontrado");

      // Validación de stock
      if (tipo === "SALIDA" && actual.cantidad < cantidadInt) {
        await registrarBitacora(
          req,
          "Inventario",
          "ERROR",
          `Intento de salida (${cantidadInt}) mayor al stock disponible (${actual.cantidad})`
        );
        return res.redirect("/inventario/tuberia?msg=cantidad");
      }

      // Actualizar inventario
      const signo = tipo === "INGRESO" ? 1 : -1;
      await pool.query(
        "UPDATE Tuberia SET cantidad = cantidad + ? WHERE id_tuberia = ?",
        [signo * cantidadInt, id_item]
      );

      // Armar texto de diámetro para la bitácora
      if (actual.diametro) {
        //diametroTexto = ` Diámetro: ${actual.diametro}"`;
        diametroTexto = ` Diámetro: ${actual.diametro}`;

      }
    }

    // Registrar movimiento final
    await pool.query("CALL sp_registrar_movimiento(?, ?, ?, ?, ?, ?)", [
      usuario.id_usuario,
      categoria,
      id_item,
      tipo,
      cantidadInt,
      motivo
    ]);

    // Registrar en bitácora (ya con el diámetro incluido si aplica)
    await registrarBitacora(
      req,
      "Inventario",
      "EDITAR",
      `Movimiento de inventario (${categoria}) - ${tipo} de ${cantidadInt},${diametroTexto}, Motivo: ${motivo}`//registrar descripcion
    );

    return res.redirect("/inventario/tuberia?msg=ok");

  } catch (err) {
    console.error("Error procesando solicitud:", err);
    await registrarBitacora(
      req,
      "Inventario",
      "ERROR",
      `Error al procesar solicitud de inventario: ${err.message}`
    );
    return res.redirect("/inventario/tuberia?msg=error");
  }
};
