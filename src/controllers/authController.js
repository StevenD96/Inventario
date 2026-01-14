// src/controllers/authController.js
import pool from "../models/db.js";
import bcrypt from "bcryptjs";

//Mostrar formulario de login 
export const mostrarLogin = (req, res) => {
  res.render("auth/login", { layout: "main", title: "Iniciar Sesión" });
};

// === Procesar inicio de sesión ===
export const procesarLogin = async (req, res) => {
  const { usuario, contrasena } = req.body;

  try {
    // Llamar al procedimiento almacenado (trae datos del usuario y el hash)
    const [rows] = await pool.query("CALL sp_validar_login(?, ?)", [usuario, contrasena]);
    const resultado = rows[0][0];

    // Validar existencia de usuario
    if (!resultado || resultado.estado !== "OK") {
      return res.render("auth/login", {
        layout: "main",
        title: "Iniciar Sesión",
        error: resultado?.mensaje || "Usuario o contraseña inválidos",
      });
    }

    // === Comparar contraseña con el hash (bcrypt) ===
    const passwordMatch = await bcrypt.compare(contrasena, resultado.contrasena_hash);

    if (!passwordMatch) {
      // Registrar intento fallido en bitácora
      const idUsuario = resultado.id_usuario || 0;
      await pool.query("CALL sp_registrar_bitacora(?, ?, ?, ?)", [
        idUsuario,
        "Login",
        "ERROR",
        "Intento de inicio de sesión con contraseña incorrecta",
      ]);

      return res.render("auth/login", {
        layout: "main",
        title: "Iniciar Sesión",
        error: "Usuario o contraseña inválidos",
      });
    }

    // === Guardar datos de sesión ===
    req.session.usuario = {
      id_usuario: resultado.id_usuario,
      nombre_usuario: resultado.nombre_usuario || usuario,
      nombre_completo: resultado.nombre_completo || usuario,
      rol: resultado.rol
    };

    // === Verificar si requiere cambio de contraseña ===
    if (resultado.cambio_contrasena_hash === 1 || resultado.requiereCambioClave === 1) {
      // Registrar en bitácora
      await pool.query("CALL sp_registrar_bitacora(?, ?, ?, ?)", [
        resultado.id_usuario,
        "Login",
        "CONSULTAR",
        "Usuario requiere cambio de contraseña",
      ]);

      // Redirigir a pantalla de cambio de clave
      return res.redirect("/cambiar-clave");
    }

    // === Registrar inicio exitoso en bitácora ===
    await pool.query("CALL sp_registrar_bitacora(?, ?, ?, ?)", [
      resultado.id_usuario,
      "Login",
      "CONSULTAR",
      "Inicio de sesión exitoso.",
    ]);

    // === Actualizar último ingreso ===
    await pool.query("UPDATE usuario SET ultimo_ingreso = NOW() WHERE id_usuario = ?", [
      resultado.id_usuario,
    ]);

    // === Redirigir según rol ===
    if (resultado.rol === "Admin") {
      return res.redirect("/dashboard");
    } else {
      return res.redirect("/dashboard");
    }
  } catch (error) {
    console.error("Error en login:", error.message);
    res.render("auth/login", {
      layout: "main",
      title: "Iniciar Sesión",
      error: "Ocurrió un error interno. Intente más tarde.",
    });
  }
};

// === Cerrar sesión ===
export const cerrarSesion = (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.redirect("/");
    });
  } else {
    res.redirect("/");
  }
};
