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
      rolUsuario: req.session.usuario?.rol || "User"

      
    });
  } catch (err) {
    console.error("Error listando usuarios:", err.message);
    res.status(500).send("Error interno");
  }
};

//Creacion de usuario y 
export const crearUsuario = async (req, res) => {
  const { nombre_completo, nombre_usuario, correo, rol } = req.body;

  // Generar contraseña temporal aleatoria
  const contrasenaTemporal = Math.random().toString(36).slice(-8);
  const contrasenaHash = await bcrypt.hash(contrasenaTemporal, 10);

  try {
    // Llamar al procedimiento almacenado
    const [rows] = await pool.query(
      "CALL sp_crear_usuario(?, ?, ?, ?, ?)",
      [nombre_completo, nombre_usuario, correo, rol, contrasenaHash]
    );

    // El SP devuelve el id_usuario
    const id_usuario = rows[0][0]?.id_usuario || null;

    // Registrar en bitácora (si existe id válido)
    if (id_usuario) {
      await pool.query("CALL sp_registrar_bitacora(?, ?, ?, ?)", [
        id_usuario,
        "Usuarios",
        "CREAR",
        `Se creó el usuario ${nombre_usuario}`
      ]);
    }

    // Enviar correo con contraseña temporal
    const correoEnviado = await enviarCorreo({
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
    });

    if (!correoEnviado) {
      console.warn("Usuario creado, pero el correo no se pudo enviar.");
    }

    //Redirigir al listado de usuarios
    /*res.redirect("/usuarios");
  } catch (err) {
    console.error("Error creando usuario:", err.message);
    if (err.message.includes("Usuario o correo ya existe")) {
      res.status(400).send("El usuario o correo ya está registrado.");
    } else {
      res.status(500).send("Error al crear el usuario.");
    }
  }

};*/
 res.redirect("/usuarios?ok=1");
  } catch (err) {
    console.error("Error creando usuario:", err.message);

    if (err.message.includes("Usuario o correo ya existe")) {
      res.redirect("/usuarios?error=existe");
    } else {
      res.redirect("/usuarios?error=1");
    }
  }
};
