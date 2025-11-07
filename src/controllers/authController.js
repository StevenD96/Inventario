// src/controllers/authController.js
import pool from "../models/db.js";

// Mostrar el formulario de login
export const mostrarLogin = (req, res) => {
  res.render("auth/login", { layout: "main", title: "Iniciar Sesión" });
};

// Procesar el inicio de sesión
export const procesarLogin = async (req, res) => {
  const { usuario, contrasena } = req.body;

  try {
    // Llamar al procedimiento almacenado para validar credenciales
    const [rows] = await pool.query("CALL sp_validar_login(?, ?)", [usuario, contrasena]);
    const resultado = rows[0][0];

    if (resultado && resultado.estado === "OK") {
      // Guardar datos en la sesión
      /*req.session.usuario = {
        id_usuario: resultado.id_usuario,
        nombre_usuario: usuario,
        rol: resultado.rol,
      };*/
      req.session.usuario = {
      id_usuario: resultado.id_usuario,
      nombre_usuario: resultado.nombre_usuario || usuario,
      nombre_completo: resultado.nombre_completo || usuario,
      rol: resultado.rol
      };


      // Registrar en bitácora el inicio exitoso
      await pool.query("CALL sp_registrar_bitacora(?, ?, ?, ?)", [
        resultado.id_usuario,
        "Login",
        "CONSULTAR",
        "Inicio de sesión exitoso",
      ]);

      // Redirigir según rol
      if (resultado.rol === "Admin") {
        res.redirect("/dashboard");
      } else {
        res.redirect("/consulta");
      }
    } else {
      // Buscar si el usuario existe para registrar intento fallido
      const [[user]] = await pool.query(
        "SELECT id_usuario FROM Usuario WHERE nombre_usuario = ? LIMIT 1",
        [usuario]
      );
      const id_usuario = user ? user.id_usuario : 0;

      // Registrar intento fallido en bitácora
      await pool.query("CALL sp_registrar_bitacora(?, ?, ?, ?)", [
        id_usuario,
        "Login",
        "ERROR",
        "Intento de inicio de sesión fallido",
      ]);

      res.render("auth/login", {
        layout: "main",
        title: "Iniciar Sesión",
        error: resultado.mensaje || "Usuario o contraseña inválidos",
      });
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

// Cerrar sesión
export const cerrarSesion = (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.redirect("/");
    });
  } else {
    res.redirect("/");
  }
};
