// src/controllers/bitacoraController.js
import pool from "../models/db.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";



const PAGE_SIZE = 10;

export const listarBitacora = async (req, res) => {
  try {
    const usuarioSesion = req.session.usuario;
    if (!usuarioSesion) {
      return res.redirect("/");
    }

    // Fecha actual para valores por defecto
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1; // 1-12
    const anioActual = ahora.getFullYear();

    // Filtros recibidos por querystring
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const mes = parseInt(req.query.mes || mesActual, 10);
    const anio = parseInt(req.query.anio || anioActual, 10);

    const usuarioFiltro = req.query.usuario
      ? parseInt(req.query.usuario, 10)
      : 0; // 0 = Todos

    const moduloFiltro = req.query.modulo || "Todos";
    const offset = (page - 1) * PAGE_SIZE;

    const p_modulo = moduloFiltro === "Todos" ? "" : moduloFiltro;

    // Llamar al SP de bitácora (paginado)
    const [result] = await pool.query(
      "CALL sp_bitacora_filtrar(?, ?, ?, ?, ?, ?)",
      [mes, anio, usuarioFiltro, p_modulo, PAGE_SIZE, offset]
    );

    // Por el orden del SP: primero viene el total, luego los registros
    const total = result[0][0]?.total || 0; // primer SELECT
    const registros = result[1] || []; // segundo SELECT

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const pages = Array.from({ length: totalPages }, (_, i) => ({
      num: i + 1,
      active: i + 1 === page,
    }));

    // Listado de usuarios para el combo de filtro
    const [usuariosRows] = await pool.query(
      "SELECT id_usuario, nombre_usuario FROM usuario WHERE estado <> 'Inactivo' ORDER BY nombre_usuario"
    );

    // Catálogo de meses
    const meses = [
      { value: 1, name: "Enero" },
      { value: 2, name: "Febrero" },
      { value: 3, name: "Marzo" },
      { value: 4, name: "Abril" },
      { value: 5, name: "Mayo" },
      { value: 6, name: "Junio" },
      { value: 7, name: "Julio" },
      { value: 8, name: "Agosto" },
      { value: 9, name: "Septiembre" },
      { value: 10, name: "Octubre" },
      { value: 11, name: "Noviembre" },
      { value: 12, name: "Diciembre" },
    ];

    // Rango de años (ajústalo si quieres más)
    const anios = [];
    for (let y = anioActual - 1; y <= anioActual + 1; y++) {
      anios.push({ value: y });
    }

    // Módulos disponibles de la bitácora
    const modulos = [
      { value: "Todos", name: "Todos" },
      { value: "Inventario", name: "Inventario" },
      { value: "Login", name: "Login" },
      { value: "Usuarios", name: "Usuarios" },
      { value: "Accesorios", name: "Accesorios" },  
      { value: "Cloro", name: "Cloro" },
      { value: "Herramientas", name: "Herramientas" },
      { value: "Limpieza", name: "Limpieza" },
      { value: "Medidores", name: "Medidores" },
      { value: "Pegamentos", name: "Pegamentos" },
      { value: "Tuberia", name: "Tubería" }
    ];

    res.render("bitacora/index", {
      layout: "app",
      title: "Bitácora del Sistema",

      // Header
      usuario: usuarioSesion,
      nombreUsuario: usuarioSesion.nombre_completo,
      rolUsuario: usuarioSesion.rol,

      // Datos para la vista
      registros,
      usuarios: usuariosRows,
      meses,
      anios,
      modulos,

      filtros: {
        mes,
        anio,
        usuario: usuarioFiltro,
        modulo: moduloFiltro,
      },

      page,
      total,
      mostrando: registros.length ? Math.min(page * PAGE_SIZE, total) : 0,
      totalPages,
      pages,
    });
  } catch (error) {
    console.error("Error al listar bitácora:", error);
    res.status(500).send("Error interno al listar la bitácora.");
  }
};

// =====================================================
// EXPORTAR EXCEL
// =====================================================

export const exportarBitacoraExcel = async (req, res) => {
  try {
    const usuarioSesion = req.session.usuario;
    if (!usuarioSesion) {
      return res.redirect("/");
    }

    // Usamos los mismos filtros que en la pantalla
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();

    const mes = parseInt(req.query.mes || mesActual, 10);
    const anio = parseInt(req.query.anio || anioActual, 10);
    const usuarioFiltro = req.query.usuario
      ? parseInt(req.query.usuario, 10)
      : 0;
    const moduloFiltro = req.query.modulo || "Todos";
    const p_modulo = moduloFiltro === "Todos" ? "" : moduloFiltro;

    // Para exportar: traemos "todos" los registros (sin paginar)
    const MAX_REGISTROS = 1000000;
    const [result] = await pool.query(
      "CALL sp_bitacora_filtrar(?, ?, ?, ?, ?, ?)",
      [mes, anio, usuarioFiltro, p_modulo, MAX_REGISTROS, 0]
    );

    const registros = result[1] || [];

    // Crear workbook de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Bitácora");

    // Encabezados
    worksheet.columns = [
      { header: "Fecha y Hora", key: "fecha", width: 22 },
      { header: "Usuario", key: "usuario", width: 25 },
      { header: "Módulo", key: "modulo", width: 20 },
      { header: "Acción", key: "accion", width: 15 },
      { header: "Descripción", key: "descripcion", width: 60 },
    ];

    // Filas
    registros.forEach((row) => {
      worksheet.addRow({
        fecha: row.fecha,
        usuario: row.usuario,
        modulo: row.modulo,
        accion: row.accion,
        descripcion: row.descripcion,
      });
    });

    // Estilo simple (negrita en encabezado)
    worksheet.getRow(1).font = { bold: true };

    // Nombre del archivo
    const nombreArchivo = `bitacora_${anio}_${String(mes).padStart(2, "0")}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivo}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error al exportar bitácora a Excel:", error);
    res.status(500).send("Error al exportar la bitácora a Excel.");
  }
};

// =====================================================
// EXPORTAR PDF
// =====================================================

export const exportarBitacoraPdf = async (req, res) => {
  try {
    const usuarioSesion = req.session.usuario;
    if (!usuarioSesion) {
      return res.redirect("/");
    }

    // Mismos filtros que en la pantalla
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();

    const mes = parseInt(req.query.mes || mesActual, 10);
    const anio = parseInt(req.query.anio || anioActual, 10);
    const usuarioFiltro = req.query.usuario
      ? parseInt(req.query.usuario, 10)
      : 0;
    const moduloFiltro = req.query.modulo || "Todos";
    const p_modulo = moduloFiltro === "Todos" ? "" : moduloFiltro;

    const MAX_REGISTROS = 1000000;
    const [result] = await pool.query(
      "CALL sp_bitacora_filtrar(?, ?, ?, ?, ?, ?)",
      [mes, anio, usuarioFiltro, p_modulo, MAX_REGISTROS, 0]
    );

    const registros = result[1] || [];

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });

    const nombreArchivo = `bitacora_${anio}_${String(mes).padStart(2, "0")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivo}"`
    );

    doc.pipe(res);

    // Título
    doc
      .fontSize(18)
      .text("Bitácora del Sistema", { align: "center" })
      .moveDown(0.5);

    // Resumen de filtros
    doc
      .fontSize(10)
      .text(`Mes: ${mes}`, { continued: true })
      .text(`   Año: ${anio}`, { continued: true })
      .text(`   Usuario: ${usuarioFiltro === 0 ? "Todos" : usuarioFiltro}`, {
        continued: true,
      })
      .text(`   Módulo: ${moduloFiltro}`)
      .moveDown(0.5);

    doc.text(`Total de registros: ${registros.length}`).moveDown(1);

    // Encabezados de "tabla"
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Fecha y Hora", { width: 120, continued: true });
    doc.text("Usuario", { width: 120, continued: true });
    doc.text("Módulo", { width: 80, continued: true });
    doc.text("Acción", { width: 70, continued: true });
    doc.text("Descripción", { width: 280 });
    doc.moveDown(0.3);
    doc.font("Helvetica");
    doc.moveTo(30, doc.y).lineTo(800, doc.y).stroke();
    doc.moveDown(0.5);

    // Filas
    registros.forEach((row) => {
      // Si estamos muy abajo en la página, agregar nueva página
      if (doc.y > 520) {
        doc.addPage();
        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("Fecha y Hora", { width: 120, continued: true });
        doc.text("Usuario", { width: 120, continued: true });
        doc.text("Módulo", { width: 80, continued: true });
        doc.text("Acción", { width: 70, continued: true });
        doc.text("Descripción", { width: 280 });
        doc.moveDown(0.3);
        doc.font("Helvetica");
        doc.moveTo(30, doc.y).lineTo(800, doc.y).stroke();
        doc.moveDown(0.5);
      }

      doc.fontSize(9);
      doc.text(row.fecha || "", { width: 120, continued: true });
      doc.text(row.usuario || "", { width: 120, continued: true });
      doc.text(row.modulo || "", { width: 80, continued: true });
      doc.text(row.accion || "", { width: 70, continued: true });
      doc.text(row.descripcion || "", { width: 280 });
      doc.moveDown(0.3);
    });

    doc.end();
  } catch (error) {
    console.error("Error al exportar bitácora a PDF:", error);
    res.status(500).send("Error al exportar la bitácora a PDF.");
  }
};
//Eliminar registros
export const eliminarBitacoraFiltrada = async (req, res) => {
  try {
    const { mes, anio, usuario, modulo } = req.body;

    const p_modulo = modulo === "Todos" ? "" : modulo;
    const p_usuario = usuario === "0" ? 0 : parseInt(usuario);

    await pool.query(
      "CALL sp_bitacora_eliminar_filtrados(?, ?, ?, ?)",
      [parseInt(mes), parseInt(anio), p_usuario, p_modulo]
    );

    req.session.mensaje = {
      tipo: "success",
      texto: "Los registros de bitácora filtrados fueron eliminados correctamente."
    };

    res.redirect("/bitacora");

  } catch (error) {
    console.error("Error al eliminar bitácora:", error);

    req.session.mensaje = {
      tipo: "danger",
      texto: "Ocurrió un error al intentar eliminar los registros."
    };

    res.redirect("/bitacora");
  }
};
