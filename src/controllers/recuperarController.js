// src/controllers/recuperarController.js
import pool from "../models/db.js";
import { enviarCorreo } from "../utils/mailer.js";

// GET /recuperar  -> muestra la pantalla para ingresar el correo
export const mostrarRecuperar = (req, res) => {
  res.render("auth/recuperar", {
    layout: "main",
    title: "Recuperar contraseña"
  });
};

// POST /recuperar -> valida correo, genera token, envía email y abre modal
export const procesarRecuperar = async (req, res) => {
  const { correo } = req.body;

  try {
    const [[usuario]] = await pool.query(
      "SELECT id_usuario, nombre_completo FROM Usuario WHERE correo = ?",
      [correo]
    );

    if (!usuario) {
      return res.render("auth/recuperar", {
        layout: "main",
        title: "Recuperar contraseña",
        error: "El correo ingresado no está registrado.",
        correo
      });
    }

    // Token de 6 dígitos válido por 2 minutos
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const validoHasta = new Date(Date.now() + 2 * 60 * 1000);

    await pool.query(
      "INSERT INTO RecuperacionToken (id_usuario, token, valido_hasta) VALUES (?, ?, ?)",
      [usuario.id_usuario, token, validoHasta]
    );

    await enviarCorreo({
      to: correo,
      subject: "Recuperación de contraseña - CMD Cervantes",
      html: `
        <p>Hola <strong>${usuario.nombre_completo}</strong>,</p>
        <p>Tu código de verificación es:</p>
        <h2 style="letter-spacing:3px">${token}</h2>
        <p>Este código es válido por 2 minutos.</p>
        <p>Si no solicitaste esta acción, ignora este mensaje.</p>
      `
    });

    return res.render("auth/recuperar", {
      layout: "main",
      title: "Recuperar contraseña",
      success: "Correo válido. Se ha enviado un token a su correo electrónico.",
      showTokenModal: true,
      correo
    });
  } catch (error) {
    console.error("Error en recuperación:", error.message);
    return res.render("auth/recuperar", {
      layout: "main",
      title: "Recuperar contraseña",
      error: "Ocurrió un error interno. Intente nuevamente.",
      correo: req.body?.correo || ""
    });
  }
};

// POST /verificar-token -> valida token y redirige a /cambiar-clave
export const procesarVerificarToken = async (req, res) => {
  const { correo, token } = req.body;

  try {
    const [[usuario]] = await pool.query(
      "SELECT id_usuario FROM Usuario WHERE correo = ?",
      [correo]
    );

    if (!usuario) {
      return res.render("auth/recuperar", {
        layout: "main",
        title: "Recuperar contraseña",
        error: "El correo no está registrado.",
        correo
      });
    }

    // Último token emitido para ese usuario con ese código
    const [[registro]] = await pool.query(
      "SELECT * FROM RecuperacionToken WHERE id_usuario = ? AND token = ? ORDER BY fecha_generado DESC LIMIT 1",
      [usuario.id_usuario, token]
    );

    if (!registro) {
      return res.render("auth/recuperar", {
        layout: "main",
        title: "Recuperar contraseña",
        tokenError: "Token inválido. Verifique el código enviado a su correo.",
        showTokenModal: true,
        correo
      });
    }

    const ahora = new Date();
    const expira = new Date(registro.valido_hasta);
    if (ahora > expira) {
      return res.render("auth/recuperar", {
        layout: "main",
        title: "Recuperar contraseña",
        tokenError: "El token ha expirado. Solicite uno nuevo.",
        showTokenModal: true,
        correo
      });
    }

    // Token válido → guardar id temporal en sesión y redirigir a cambio de contraseña
    req.session.resetUserId = usuario.id_usuario;
    return res.redirect("/cambiar-clave");
  } catch (error) {
    console.error("Error verificando token:", error.message);
    return res.render("auth/recuperar", {
      layout: "main",
      title: "Recuperar contraseña",
      tokenError: "Error al verificar el token. Intente nuevamente.",
      showTokenModal: true,
      correo
    });
  }
};
