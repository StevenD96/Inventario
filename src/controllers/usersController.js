// src/controllers/usersController.js
import bcrypt from "bcryptjs"; //contraseña
import { enviarCorreo } from "../utils/mailer.js"; //correo
import pool from "../models/db.js";

const PAGE_SIZE = 10;

export const listarUsuarios = async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const q = (req.query.q || "").trim();
  const offset = (page - 1) * PAGE_SIZE;

  // filtros de búsqueda en nombre, usuario o correo
  const like = `%${q}%`;
  // Codigo de consulta
  try {
    // total
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM Usuario
       WHERE estado <> 'Inactivo'
         AND ( ? = '' OR nombre_completo LIKE ? OR nombre_usuario LIKE ? OR correo LIKE ? )`,
      [q, like, like, like]
    );

    // datos página
    const [rows] = await pool.query(
      `SELECT id_usuario, nombre_completo, nombre_usuario, correo, rol
       FROM Usuario
       WHERE estado <> 'Inactivo'
         AND ( ? = '' OR nombre_completo LIKE ? OR nombre_usuario LIKE ? OR correo LIKE ? )
       ORDER BY nombre_completo
       LIMIT ? OFFSET ?`,
      [q, like, like, like, PAGE_SIZE, offset]
    );

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push({ num: i, active: i === page });
    }

    res.render("users/index", {
      layout: "app",
      title: "Usuarios",
      usuario: req.session.usuario,        // para el encabezado
      usuarios: rows,
      q,
      page,
      total,
      mostrando: rows.length ? Math.min(page * PAGE_SIZE, total) : 0,
      totalPages,
      prevPage: Math.max(1, page - 1),
      nextPage: Math.min(totalPages, page + 1),
      pages,
      nombreUsuario: req.session.usuario?.nombre_completo || "Usuario",
      rolUsuario: req.session.usuario?.rol || "User",
      agregado: req.query.add,
      editado: req.query.edit,
      eliminado: req.query.delete,
      existe: req.query.existe
      
    });
  } catch (err) {
    console.error("Error listando usuarios:", err.message);
    res.status(500).send("Error interno");
  }
};

export const crearUsuario = async (req, res) => {
  const { nombre_completo, nombre_usuario, correo, rol } = req.body;

  // Generar contraseña temporal aleatoria
  const contrasenaTemporal = Math.random().toString(36).slice(-8);
  const contrasenaHash = await bcrypt.hash(contrasenaTemporal, 10);

  try {
    // Crear usuario via SP
    const [rows] = await pool.query(
      "CALL sp_crear_usuario(?, ?, ?, ?, ?)",
      [nombre_completo, nombre_usuario, correo, rol, contrasenaHash]
    );

    const id_usuario = rows[0][0]?.id_usuario || null;

    // Registrar bitácora
    if (id_usuario) {
      const id_admin = req.session.usuario.id_usuario;

      await pool.query("CALL sp_registrar_bitacora(?, ?, ?, ?)", [
        id_admin,
        "Usuarios",
        "CREAR",
        `Se creó el usuario: ${nombre_usuario}`
      ]);
    }

    // Envío de correo ASÍNCRONO (no bloquea el sistema)
    enviarCorreo({
      to: correo,
      subject: "Acceso al Sistema de Inventario CMD Cervantes",
      html: `
        <p>Hola <strong>${nombre_completo}</strong>,</p>
        <p>Tu cuenta en el <b>Sistema de Gestión de Inventario CMD Cervantes</b> ha sido creada correctamente.</p>
        <p><b>Usuario:</b> ${nombre_usuario}</p>
        <p><b>Contraseña temporal:</b> ${contrasenaTemporal}</p>
        <p>Por seguridad, deberás cambiar tu contraseña en tu primer inicio de sesión.</p>
        <br>
        <p>Atentamente,<br><strong>CMD Cervantes</strong></p>
      `
    }).catch(err => {
      console.error("Error enviando correo:", err);
    });

    // Respuesta inmediata
    res.redirect("/usuarios?add=1");

  } catch (err) {
    console.error("Error creando usuario:", err.message);

    if (err.message.includes("Usuario o correo ya existe")) {
      return res.redirect("/usuarios?existe=1");
    }

    return res.redirect("/usuarios?error=1");
  }
};



// Obtener usuario por ID (para AJAX)
export const obtenerUsuarioPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT id_usuario, nombre_completo, nombre_usuario, correo, rol
       FROM Usuario
       WHERE id_usuario = ? AND estado <> 'Inactivo'
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json(rows[0]);

  } catch (err) {
    console.error("Error obteniendo usuario:", err.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Editar usuario (POST)
export const editarUsuario = async (req, res) => {
  const {
    id_usuario,
    nombre_completo,
    nombre_usuario,
    correo,
    rol
  } = req.body;

  try {
    // Obtener datos actuales
    const [rows] = await pool.query(
      "SELECT nombre_completo, nombre_usuario, correo, rol FROM Usuario WHERE id_usuario = ?",
      [id_usuario]
    );

    const actual = rows[0];
    if (!actual) throw new Error("Usuario no encontrado");

    // Detectar cambios
    let cambios = [];

    if (actual.nombre_completo !== nombre_completo)
      cambios.push(`Nombre completo: ${actual.nombre_completo} → ${nombre_completo}`);

    if (actual.nombre_usuario !== nombre_usuario)
      cambios.push(`Usuario: ${actual.nombre_usuario} → ${nombre_usuario}`);

    if (actual.correo !== correo)
      cambios.push(`Correo: ${actual.correo} → ${correo}`);

    if (actual.rol !== rol)
      cambios.push(`Rol: ${actual.rol} → ${rol}`);

    // Si NO hubo cambios → no registrar nada y no mostrar mensaje
    if (cambios.length === 0) {
      return res.redirect("/usuarios"); // sin ?edit
    }

    // Si hubo cambios → actualizar y registrar en bitácora
    await pool.query(
      "CALL sp_actualizar_usuario(?, ?, ?, ?, ?)",
      [id_usuario, nombre_completo, nombre_usuario, correo, rol]
    );

    const id_admin = req.session.usuario.id_usuario;

    await pool.query("CALL sp_registrar_bitacora(?, ?, ?, ?)", [
      id_admin,
      "Usuarios",
      "EDITAR",
      `Usuario ${actual.nombre_usuario} modificado: ${cambios.join(", ")}`
    ]);

    return res.redirect("/usuarios?edit=1");

  } catch (err) {
    console.error("Error editando usuario:", err.message);

    if (err.message.includes("Usuario o correo ya existe")) {
      return res.redirect("/usuarios?error=existe=1");
    }

    return res.redirect("/usuarios?error=1");
  }
};


//Eliminar usuario
export const eliminarUsuario = async (req, res) => {
  const { id_usuario } = req.body;
  const id_admin = req.session.usuario.id_usuario;

  try {
    // Evitar auto-eliminación
    if (parseInt(id_usuario) === id_admin) {
      return res.redirect("/usuarios?error=self");
    }

    // 1️⃣ Obtener datos del usuario antes de inactivarlo
    const [rows] = await pool.query(
      "SELECT nombre_usuario FROM Usuario WHERE id_usuario = ?",
      [id_usuario]
    );

    const nombreUsuario = rows.length ? rows[0].nombre_usuario : "(desconocido)";

    // 2️⃣ Inactivar usuario mediante SP
    await pool.query("CALL sp_inactivar_usuario(?)", [id_usuario]);

    // 3️⃣ Registrar en bitácora con nombre real del usuario
    await pool.query(
      "CALL sp_registrar_bitacora(?, ?, ?, ?)",
      [
        id_admin,
        "Usuarios",
        "ELIMINAR",
        `Usuario ${nombreUsuario} marcado como inactivo`
      ]
    );

    return res.redirect("/usuarios?delete=1");

  } catch (err) {
    console.error("Error eliminando usuario:", err);
    return res.redirect("/usuarios?error=delete");
  }
};

