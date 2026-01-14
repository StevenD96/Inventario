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
      "El usuario consultó el inventario de tuberías."
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
      moduloInventario: "Tubería", //cambio
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

    const [result] = await pool.query("CALL sp_accesorios_listar(?, ?, ?)", [
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
      "El usuario consultó el inventario de accesorios."
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
   LISTADO DE INVENTARIO - PEGAMENTOS
   ===================================================== */
export const inventarioPegamentos = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

    // SP
    const [result] = await pool.query("CALL sp_pegamentos_listar(?, ?, ?)", [
      q,
      PAGE_SIZE,
      offset
    ]);

    const total = result[0][0]?.total || 0;
    const pegamentos = result[1] || [];

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const pages = Array.from({ length: totalPages }, (_, i) => ({
      num: i + 1,
      active: page === i + 1
    }));

    // Convertir a formato genérico para usar la vista inventario/index.hbs
    const items = pegamentos.map(p => ({
      id_item: p.id_pegamento,
      descripcion: p.descripcion,
      especificacion: p.especificacion,
      cantidad: p.cantidad,
      categoria: "Pegamentos"
    }));

    await registrarBitacora(req, "Inventario", "CONSULTAR", "El usuario consultó el inventario de pegamentos.");

    let mensaje = null;
    if (req.query.msg === "ok") {
      mensaje = { tipo: "success", texto: "Solicitud realizada con éxito" };
    } else if (req.query.msg === "cantidad") {
      mensaje = { tipo: "warning", texto: "La cantidad ingresada no es válida" };
    } else if (req.query.msg === "error") {
      mensaje = { tipo: "danger", texto: "Error al procesar la solicitud" };
    }

    res.render("inventario/pegamentos", {
      layout: "app",
      title: "Inventario - Pegamentos",

      usuario,
      nombreUsuario: usuario.nombre_completo,
      rolUsuario: usuario.rol,

      moduloActivo: "Pegamentos",
      moduloInventario: "Pegamentos",

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
    console.error("Error listando inventario de pegamentos:", err);
    await registrarBitacora(
      req,
      "Inventario",
      "ERROR",
      `Error al listar inventario de pegamentos: ${err.message}`
    );
    res.status(500).send("Error interno al listar pegamentos.");
  }
};

/* =====================================================
   LISTADO DE INVENTARIO - CLORO
   ===================================================== */
export const inventarioCloro = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

    // Llamar SP de Cloro
    const [result] = await pool.query("CALL sp_cloro_listar(?, ?, ?)", [
      q,
      PAGE_SIZE,
      offset
    ]);

    const total = result[0][0]?.total || 0;
    const cloro = result[1] || [];

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const pages = Array.from({ length: totalPages }, (_, i) => ({
      num: i + 1,
      active: page === i + 1
    }));

    // Adaptar datos al formato estándar de inventario
    const items = cloro.map(c => ({
      id_item: c.id_cloro,
      descripcion: c.descripcion,
      especificacion: c.especificacion,
      cantidad: c.cantidad,
      categoria: "Cloro"
    }));

    await registrarBitacora(
      req,
      "Inventario",
      "CONSULTAR",
      "El usuario consultó el inventario de cloro."
    );

    let mensaje = null;
    if (req.query.msg === "ok") {
      mensaje = { tipo: "success", texto: "Solicitud realizada con éxito" };
    } else if (req.query.msg === "cantidad") {
      mensaje = { tipo: "warning", texto: "La cantidad ingresada no es válida" };
    } else if (req.query.msg === "error") {
      mensaje = { tipo: "danger", texto: "Error al procesar la solicitud" };
    }

    res.render("inventario/cloro", {
      layout: "app",
      title: "Inventario - Cloro",
      usuario,
      nombreUsuario: usuario.nombre_completo,
      rolUsuario: usuario.rol,
      moduloActivo: "Inventario",
      moduloInventario: "Cloro",

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
    console.error("Error listando inventario de cloro:", err);
    await registrarBitacora(
      req,
      "Inventario",
      "ERROR",
      `Error al listar inventario de cloro: ${err.message}`
    );
    res.status(500).send("Error interno al listar inventario de cloro.");
  }
};

/* ===================================================== 
   LISTADO DE INVENTARIO - MEDIDORES
   ===================================================== */
export const inventarioMedidores = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

    // Llamar SP
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
      active: page === i + 1
    }));

    // Adaptar datos al formato estándar de inventario/index.hbs
    const items = medidores.map(m => ({
      id_item: m.id_medidor,
      descripcion: m.descripcion,
      especificacion: m.especificacion,
      cantidad: m.cantidad,
      categoria: "Medidores"
    }));

    // Bitácora
    await registrarBitacora(
      req,
      "Inventario",
      "CONSULTAR",
      "El usuario consultó el inventario de medidores."
    );

    // Mensajes
    let mensaje = null;
    if (req.query.msg === "ok") {
      mensaje = { tipo: "success", texto: "Solicitud realizada con éxito" };
    } else if (req.query.msg === "cantidad") {
      mensaje = { tipo: "warning", texto: "La cantidad ingresada no es válida" };
    } else if (req.query.msg === "error") {
      mensaje = { tipo: "danger", texto: "Error al procesar la solicitud" };
    }

    res.render("inventario/medidores", {
      layout: "app",
      title: "Inventario - Medidores",
      usuario,
      nombreUsuario: usuario.nombre_completo,
      rolUsuario: usuario.rol,
      moduloActivo: "Medidores",
      moduloInventario: "Medidores",
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
    console.error("Error listando inventario de Medidores:", err);
    await registrarBitacora(
      req,
      "Inventario",
      "ERROR",
      `Error al listar inventario de medidores: ${err.message}`
    );
    res.status(500).send("Error interno al listar medidores.");
  }
};

/* ===================================================== 
   LISTADO DE INVENTARIO - Herramientas
   ===================================================== */
   export const inventarioHerramientas = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

    const [result] = await pool.query("CALL sp_herramientas_listar(?, ?, ?)", [
      q,
      PAGE_SIZE,
      offset
    ]);

    const total = result[0][0]?.total || 0;
    const herramientas = result[1] || [];

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const pages = Array.from({ length: totalPages }, (_, i) => ({
      num: i + 1,
      active: page === i + 1
    }));

    const items = herramientas.map(h => ({
      id_item: h.id_herramienta,
      descripcion: h.descripcion,
      especificacion: h.especificacion,
      cantidad: h.cantidad,
      categoria: "Herramientas"
    }));

    await registrarBitacora(
      req,
      "Inventario",
      "CONSULTAR",
      "El usuario consultó el inventario de herramientas."
    );

    let mensaje = null;
    if (req.query.msg === "ok") mensaje = { tipo: "success", texto: "Solicitud realizada con éxito" };
    else if (req.query.msg === "cantidad") mensaje = { tipo: "warning", texto: "La cantidad ingresada no es válida" };
    else if (req.query.msg === "error") mensaje = { tipo: "danger", texto: "Error al procesar la solicitud" };

    res.render("inventario/herramientas", {
      layout: "app",
      title: "Inventario - Herramientas",
      usuario,
      nombreUsuario: usuario.nombre_completo,
      rolUsuario: usuario.rol,
      moduloActivo: "Herramientas",
      moduloInventario: "Herramientas",
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
    console.error("Error listando inventario de herramientas:", err);
    await registrarBitacora(
      req,
      "Inventario",
      "ERROR",
      `Error al listar inventario de herramientas: ${err.message}`
    );
    res.status(500).send("Error interno al listar herramientas.");
  }
};

/* =====================================================
   LISTADO DE INVENTARIO - LIMPIEZA
   ===================================================== */
export const inventarioLimpieza = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect("/");

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const q = (req.query.q || "").trim();
    const offset = (page - 1) * PAGE_SIZE;

    // SP Limpieza
    const [result] = await pool.query(
      "CALL sp_limpieza_listar(?, ?, ?)",
      [q, PAGE_SIZE, offset]
    );

    const total = result[0][0]?.total || 0;
    const limpieza = result[1] || [];

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const pages = Array.from({ length: totalPages }, (_, i) => ({
      num: i + 1,
      active: page === i + 1
    }));

    // Normalizar datos para la vista
    const items = limpieza.map(l => ({
      id_item: l.id_limpieza,
      descripcion: l.descripcion,
      cantidad: l.cantidad,
      categoria: "Limpieza"
    }));

    await registrarBitacora(
      req,
      "Inventario",
      "CONSULTAR",
      "El usuario consultó el inventario de limpieza."
    );

    let mensaje = null;
    if (req.query.msg === "ok") {
      mensaje = { tipo: "success", texto: "Solicitud realizada con éxito" };
    } else if (req.query.msg === "cantidad") {
      mensaje = { tipo: "warning", texto: "La cantidad ingresada no es válida" };
    } else if (req.query.msg === "error") {
      mensaje = { tipo: "danger", texto: "Error al procesar la solicitud" };
    }

    res.render("inventario/limpieza", {
      layout: "app",
      title: "Inventario - Limpieza",

      usuario,
      nombreUsuario: usuario.nombre_completo,
      rolUsuario: usuario.rol,

      moduloActivo: "Inventario",
      moduloInventario: "Limpieza",

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
    console.error("Error listando inventario de limpieza:", err);

    await registrarBitacora(
      req,
      "Inventario",
      "ERROR",
      `Error al listar inventario de limpieza: ${err.message}`
    );

    res.status(500).send("Error interno al listar inventario de limpieza.");
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
        "SELECT cantidad, diametro FROM tuberia WHERE id_tuberia = ?",
        [id_item]
      );

      if (!actual) throw new Error("Material no encontrado");

      if (tipo === "SALIDA" && actual.cantidad < cantidadInt) {
        await registrarBitacora(req, "Inventario", "ERROR",
          `Intento de salida (${cantidadInt}) mayor al stock disponible (${actual.cantidad})`);
        return res.redirect("/inventario/tuberia?msg=cantidad");
      }

      const signo = tipo === "INGRESO" ? 1 : -1;

      await pool.query(
        "UPDATE tuberia SET cantidad = cantidad + ? WHERE id_tuberia = ?",
        [signo * cantidadInt, id_item]
      );

      if (actual.diametro) diametroTexto = ` Diámetro: ${actual.diametro}`;
    }


    /* === ACCESORIOS === */
    if (categoria === "Accesorios") {
      const [[actual]] = await pool.query(
        "SELECT descripcion, cantidad, diametro FROM accesorios WHERE id_accesorio = ?",
        [id_item]
      );

      if (!actual) throw new Error("Accesorio no encontrado");

      if (tipo === "SALIDA" && actual.cantidad < cantidadInt) {
        await registrarBitacora(req, "Inventario", "ERROR",
          `Intento de salida (${cantidadInt}) mayor al stock disponible (${actual.cantidad})`);
        return res.redirect("/inventario/accesorios?msg=cantidad");
      }

      const signo = tipo === "INGRESO" ? 1 : -1;

      await pool.query(
        "UPDATE accesorios SET cantidad = cantidad + ? WHERE id_accesorio = ?",
        [signo * cantidadInt, id_item]
      );

      descripcionTexto = actual.descripcion ? ` ${actual.descripcion}` : "";
      diametroTexto = actual.diametro ? `, Diámetro: ${actual.diametro}` : "";
    }


    /* === PEGAMENTOS === */
    if (categoria === "Pegamentos") {

      const [[actual]] = await pool.query(
        "SELECT cantidad, descripcion, especificacion FROM pegamentos WHERE id_pegamento = ?",
        [id_item]
      );

      if (!actual) throw new Error("Pegamento no encontrado");

      if (tipo === "SALIDA" && actual.cantidad < cantidadInt) {
        await registrarBitacora(req, "Inventario", "ERROR",
          `Intento de salida (${cantidadInt}) mayor al stock disponible (${actual.cantidad})`);
        return res.redirect(`/inventario/pegamentos?msg=cantidad`);
      }

      const signo = tipo === "INGRESO" ? 1 : -1;

      await pool.query(
        "UPDATE pegamentos SET cantidad = cantidad + ? WHERE id_pegamento = ?",
        [signo * cantidadInt, id_item]
      );

      descripcionTexto = actual.descripcion ? ` ${actual.descripcion}` : "";
    }

        /* === CLORO === */
    if (categoria === "Cloro") {

      const [[actual]] = await pool.query(
        "SELECT cantidad, descripcion, especificacion FROM cloro WHERE id_cloro = ?",
        [id_item]
      );

      if (!actual) throw new Error("Cloro no encontrado");

      // Validación salida
      if (tipo === "SALIDA" && actual.cantidad < cantidadInt) {
        await registrarBitacora(
          req,
          "Inventario",
          "ERROR",
          `Intento de salida (${cantidadInt}) mayor al stock disponible (${actual.cantidad})`
        );
        return res.redirect(`/inventario/cloro?msg=cantidad`);
      }

      const signo = tipo === "INGRESO" ? 1 : -1;

      await pool.query(
        "UPDATE cloro SET cantidad = cantidad + ? WHERE id_cloro = ?",
        [signo * cantidadInt, id_item]
      );

      descripcionTexto = actual.descripcion ? ` ${actual.descripcion}` : "";
    }

        /* === MEDIDORES === */
    if (categoria === "Medidores") {

      const [[actual]] = await pool.query(
        "SELECT cantidad, descripcion, especificacion FROM medidores WHERE id_medidor = ?",
        [id_item]
      );

      if (!actual) throw new Error("Medidor no encontrado");

      // Validación de salida
      if (tipo === "SALIDA" && actual.cantidad < cantidadInt) {
        await registrarBitacora(
          req,
          "Inventario",
          "ERROR",
          `Intento de salida (${cantidadInt}) mayor al stock disponible (${actual.cantidad})`
        );
        return res.redirect(`/inventario/medidores?msg=cantidad`);
      }

      const signo = tipo === "INGRESO" ? 1 : -1;

      await pool.query(
        "UPDATE medidores SET cantidad = cantidad + ? WHERE id_medidor = ?",
        [signo * cantidadInt, id_item]
      );

      descripcionTexto = actual.descripcion ? ` ${actual.descripcion}` : "";
    }

     /* === HERRAMIENTAS=== */
    if (categoria === "Herramientas") {

      const [[actual]] = await pool.query(
        "SELECT cantidad, descripcion, especificacion FROM herramientas WHERE id_herramienta = ?",
        [id_item]
      );

      if (!actual) throw new Error("Herramienta no encontrada");

      // Validación de salida
      if (tipo === "SALIDA" && actual.cantidad < cantidadInt) {
        await registrarBitacora(
          req,
          "Inventario",
          "ERROR",
          `Intento de salida (${cantidadInt}) mayor al stock disponible (${actual.cantidad})`
        );
        return res.redirect(`/inventario/herramientas?msg=cantidad`);
      }

      const signo = tipo === "INGRESO" ? 1 : -1;

      await pool.query(
        "UPDATE herramientas SET cantidad = cantidad + ? WHERE id_herramienta = ?",
        [signo * cantidadInt, id_item]
      );

      descripcionTexto = actual.descripcion ? ` ${actual.descripcion}` : "";
    }

    /* === LIMPIEZA === */
if (categoria === "Limpieza") {

  const [[actual]] = await pool.query(
    "SELECT cantidad, descripcion FROM limpieza WHERE id_limpieza = ?",
    [id_item]
  );

  if (!actual) throw new Error("Producto de limpieza no encontrado");

  // Validación de salida
  if (tipo === "SALIDA" && actual.cantidad < cantidadInt) {
    await registrarBitacora(
      req,
      "Inventario",
      "ERROR",
      `Intento de salida (${cantidadInt}) mayor al stock disponible (${actual.cantidad})`
    );
    return res.redirect("/inventario/limpieza?msg=cantidad");
  }

  const signo = tipo === "INGRESO" ? 1 : -1;

  await pool.query(
    "UPDATE limpieza SET cantidad = cantidad + ? WHERE id_limpieza = ?",
    [signo * cantidadInt, id_item]
  );

  descripcionTexto = actual.descripcion ? ` ${actual.descripcion}` : "";
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
      `Movimiento de inventario (${categoria}) - ${tipo} de ${cantidadInt}${descripcionTexto}${diametroTexto}. Motivo: ${motivo}.`
    );

    /* === REDIRECCIÓN FINAL (OK) === */
    let rutaOk = "tuberia";
    if (categoria === "Accesorios") rutaOk = "accesorios";
    else if (categoria === "Pegamentos") rutaOk = "pegamentos";
    else if (categoria === "Cloro") rutaOk = "cloro";
    else if (categoria === "Medidores") rutaOk = "medidores";
    else if (categoria === "Herramientas") rutaOk = "herramientas";
    else if (categoria === "Limpieza") rutaOk = "limpieza";


    return res.redirect(`/inventario/${rutaOk}?msg=ok`); //cambio

  } catch (err) {
    console.error("Error procesando solicitud:", err);

    const categoriaBody = req.body.categoria || "";

    /* === REDIRECCIÓN FINAL (ERROR) === */
    let rutaError = "tuberia";
    if (categoriaBody === "Accesorios") rutaError = "accesorios";
    else if (categoriaBody === "Pegamentos") rutaError = "pegamentos";
    else if (categoriaBody === "Cloro") rutaError = "cloro";
    else if (categoriaBody === "Medidores") rutaError = "medidores";
    else if (categoriaBody === "Herramientas") rutaError = "herramientas";
    else if (categoriaBody === "Limpieza") rutaError = "limpieza";



    await registrarBitacora(
      req,
      "Inventario",
      "ERROR",
      `Error al procesar solicitud de inventario: ${err.message}`
    );

    return res.redirect(`/inventario/${rutaError}?msg=error`);
  }
};
