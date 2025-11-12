// src/controllers/passwordController.js
import bcrypt from "bcryptjs";
import pool from "../models/db.js";

// === Mostrar formulario de cambio de contraseña ===
export const mostrarCambioClave = (req, res) => {
  res.render("auth/changePassword", {
    layout: "main",
    title: "Cambio de Contraseña"
  });
};

// === Procesar cambio de contraseña ===
export const procesarCambioClave = async (req, res) => {
  const { nueva_contrasena, confirmar_contrasena } = req.body;

  // ✅ Obtener ID desde sesión normal o desde recuperación
  const id_usuario = req.session.usuario?.id_usuario || req.session.resetUserId;

  // Si no hay sesión ni token, redirige al inicio
  if (!id_usuario) return res.redirect("/");

  // === Validar contraseñas iguales ===
  if (nueva_contrasena !== confirmar_contrasena) {
    return res.render("auth/changePassword", {
      layout: "main",
      title: "Cambio de Contraseña",
      error: "Las contraseñas no coinciden."
    });
  }

  // === Validar políticas de seguridad ===
  const cumple =
    nueva_contrasena.length >= 8 &&
    /[A-Z]/.test(nueva_contrasena) &&
    /[0-9]/.test(nueva_contrasena) &&
    /[!@#$%^&*]/.test(nueva_contrasena);

  if (!cumple) {
    return res.render("auth/changePassword", {
      layout: "main",
      title: "Cambio de Contraseña",
      error:
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial (!@#$%^&*)."
    });
  }

  try {
    // === Encriptar nueva contraseña ===
    const hash = await bcrypt.hash(nueva_contrasena, 10);

    // === Actualizar en base de datos ===
    await pool.query(
      `UPDATE Usuario 
       SET contrasena_hash = ?, cambio_contrasena_hash = FALSE, actualizado_en = NOW() 
       WHERE id_usuario = ?`,
      [hash, id_usuario]
    );

    // === Registrar en bitácora ===
    await pool.query("CALL sp_registrar_bitacora(?, ?, ?, ?)", [
      id_usuario,
      "Usuarios",
      "EDITAR",
      "Cambio de contraseña exitoso"
    ]);

    // === Redirigir según contexto ===
    if (req.session.resetUserId) {
      delete req.session.resetUserId;
      return res.redirect("/"); // ✅ Vuelve al login si viene del flujo de recuperación
    }

    return res.redirect("/dashboard"); // ✅ Caso normal: rol Admin o User
  } catch (err) {
    console.error("Error al cambiar contraseña:", err.message);
    res.render("auth/changePassword", {
      layout: "main",
      title: "Cambio de Contraseña",
      error: "Error interno al actualizar la contraseña. Intente más tarde."
    });
  }
};
