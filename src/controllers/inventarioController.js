import pool from "../models/db.js";
import { registrarBitacora } from "../utils/bitacora.js";

const PAGE_SIZE = 10;

/* =====================================================
   LISTADO DE INVENTARIO - TUBERÍA
   ===================================================== */
export const inventarioTuberia = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

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

    const items = tuberias.map(t => ({
      id_item: t.id_tuberia,
      descripcion: t.descripcion,
      diametro: t.diametro,
      especificacion: t.especificacion,
      cantidad: t.cantidad,
      categoria: "Tubería"
    }));

    await registrarBitacora(
      req,
      "Inventario",
      "CONSULTAR",
      "El usuario consultó el inventario de tuberías"
    );

    let mensaje = null;
    if (req.query.msg === "ok") mensaje = { tipo: "success", texto: "Solicitud realizada con éxito" };
    else if (req.query.msg === "cantidad") mensaje = { tipo: "warning", texto: "La cantidad ingresada no es válida" };
    else if (req.query.msg === "error") mensaje = { tipo: "danger", texto: "Error al procesar la solicitud" };

    res.render("inventario/index", {
      layout: "app",
      title: "Inventario - Tubería PVC",

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

/* =====================================================
   LISTADO DE INVENTARIO - ACCESORIOS
   ===================================================== */
export const inventarioAccesorios = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

    const [result] = await pool.query("CALL accesorios_listar(?, ?, ?)", [
      q,
      PAGE_SIZE,
      offset
    ]);

    const total = result[0][0]?.total || 0;
    const accesorios = result[1] || [];

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const pages = Array.from({ length: totalPages }, (_, i) => ({
      num: i + 1,
      active: page === i + 1
    }));

    const items = accesorios.map(a => ({
      id_item: a.id_accesorio,
      descripcion: a.descripcion,
      tipo: a.tipo,
      diametro: a.diametro,
      especificacion: a.especificacion,
      cantidad: a.cantidad,
      categoria: "Accesorios"
    }));

    await registrarBitacora(
      req,
      "Inventario",
      "CONSULTAR",
      "El usuario consultó el inventario de accesorios"
    );

    let mensaje = null;
    if (req.query.msg === "ok") mensaje = { tipo: "success", texto: "Solicitud realizada con éxito" };
    else if (req.query.msg === "cantidad") mensaje = { tipo: "warning", texto: "La cantidad ingresada no es válida" };
    else if (req.query.msg === "error") mensaje = { tipo: "danger", texto: "Error al procesar la solicitud" };

    res.render("inventario/accesorios", {
      layout: "app",
      title: "Inventario - Accesorios PVC",

      usuario,
      nombreUsuario: usuario.nombre_completo,
      rolUsuario: usuario.rol,

      moduloActivo: "Inventario_Accesorios",
      moduloInventario: "Accesorios",

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
    console.error("Error listando inventario de accesorios:", err);
    await registrarBitacora(
      req,
      "Inventario",
      "ERROR",
      `Error al listar inventario de accesorios: ${err.message}`
    );
    res.status(500).send("Error interno al listar accesorios.");
  }
};

/* =====================================================
   PROCESAR SOLICITUD (INGRESO / SALIDA)
   ===================================================== */
export const procesarSolicitud = async (req, res) => {
  const usuario = req.session.usuario;
  if (!usuario) return res.redirect("/");

  try {
    const { id_item, tipo, motivo, cantidad, categoria } = req.body;

    const cantidadInt = parseInt(cantidad, 10);
    if (!cantidadInt || cantidadInt <= 0) {
      return res.redirect(`/inventario/${categoria === "Accesorios" ? "accesorios" : "tuberia"}?msg=cantidad`);
    }
    let descripcionTexto = "";
    let diametroTexto = "";

    /* === TUBERÍA === */
    if (categoria === "Tubería") {
      const [[actual]] = await pool.query(
        "SELECT cantidad, diametro FROM Tuberia WHERE id_tuberia = ?",
        [id_item]
      );

      if (!actual) throw new Error("Material no encontrado");

      if (tipo === "SALIDA" && actual.cantidad < cantidadInt) {
        await registrarBitacora(
          req,
          "Inventario",
          "ERROR",
          `Intento de salida (${cantidadInt}) mayor al stock disponible (${actual.cantidad})`
        );
        return res.redirect("/inventario/tuberia?msg=cantidad");
      }

      const signo = tipo === "INGRESO" ? 1 : -1;
      await pool.query(
        "UPDATE Tuberia SET cantidad = cantidad + ? WHERE id_tuberia = ?",
        [signo * cantidadInt, id_item]
      );

      if (actual.diametro) diametroTexto = ` Diámetro: ${actual.diametro}`;
    }

    /* === ACCESORIOS === */
    if (categoria === "Accesorios") {
  const [[actual]] = await pool.query(
    "SELECT descripcion, cantidad, diametro FROM Accesorios WHERE id_accesorio = ?",
    [id_item]
  );

  if (!actual) throw new Error("Accesorio no encontrado");

  // Validación de stock
  if (tipo === "SALIDA" && actual.cantidad < cantidadInt) {
    await registrarBitacora(
      req,
      "Inventario",
      "ERROR",
      `Intento de salida (${cantidadInt}) mayor al stock disponible (${actual.cantidad})`
    );
    return res.redirect("/inventario/accesorios?msg=cantidad");
  }

  const signo = tipo === "INGRESO" ? 1 : -1;

  await pool.query(
    "UPDATE Accesorios SET cantidad = cantidad + ? WHERE id_accesorio = ?",
    [signo * cantidadInt, id_item]
  );

  // Texto para la bitácora
  descripcionTexto = actual.descripcion
    ? ` ${actual.descripcion}`
    : "";

  diametroTexto = actual.diametro
    ? `, Diámetro: ${actual.diametro}`
    : "";
}

    /* === REGISTRAR MOVIMIENTO === */
    await pool.query("CALL sp_registrar_movimiento(?, ?, ?, ?, ?, ?)", [
      usuario.id_usuario,
      categoria,
      id_item,
      tipo,
      cantidadInt,
      motivo
    ]);

    /* === BITÁCORA === */
    await registrarBitacora(
      req,
      "Inventario",
      "EDITAR",
      //`Movimiento de inventario (${categoria}) - ${tipo} de ${cantidadInt}${diametroTexto}. Motivo: ${motivo}`
      `Movimiento de inventario (${categoria}) - ${tipo} de ${cantidadInt}${descripcionTexto}${diametroTexto}. Motivo: ${motivo}`

    );

    const rutaFinal = categoria === "Accesorios" ? "accesorios" : "tuberia";
    return res.redirect(`/inventario/${rutaFinal}?msg=ok`);

  } catch (err) {
    console.error("Error procesando solicitud:", err);

    const categoriaBody = req.body.categoria || "Tubería";
    const rutaFinal = categoriaBody === "Accesorios" ? "accesorios" : "tuberia";

    await registrarBitacora(
      req,
      "Inventario",
      "ERROR",
      `Error al procesar solicitud de inventario: ${err.message}`
    );

    return res.redirect(`/inventario/${rutaFinal}?msg=error`);
  }
};
