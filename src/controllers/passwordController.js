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

// === Procesar cambio de contrasena ===
export const procesarCambioClave = async (req, res) => {
  const { nueva_contrasena, confirmar_contrasena } = req.body;

  const id_usuario = req.session.usuario?.id_usuario || req.session.resetUserId;

  if (!id_usuario) return res.redirect("/");

  if (nueva_contrasena !== confirmar_contrasena) {
    return res.render("auth/changePassword", {
      layout: "main",
      title: "Cambio de Contrasena",
      error: "Las contrasenas no coinciden."
    });
  }

  const cumple =
    nueva_contrasena.length >= 8 &&
    /[A-Z]/.test(nueva_contrasena) &&
    /[0-9]/.test(nueva_contrasena) &&
    /[!@#$%^&*]/.test(nueva_contrasena);

  if (!cumple) {
    return res.render("auth/changePassword", {
      layout: "main",
      title: "Cambio de Contrasena",
      error: "La contrasena debe tener al menos 8 caracteres, una mayuscula, un numero y un caracter especial (!@#$%^&*)."
    });
  }

  try {
    const hash = await bcrypt.hash(nueva_contrasena, 10);

    await pool.query(
      `UPDATE usuario 
       SET contrasena_hash = ?, cambio_contrasena_hash = FALSE, actualizado_en = NOW() 
       WHERE id_usuario = ?`,
      [hash, id_usuario]
    );

    await pool.query("CALL sp_registrar_bitacora(?, ?, ?, ?)", [
      id_usuario,
      "Usuarios",
      "EDITAR",
      "Cambio de contrasena exitoso"
    ]);

    // Flujo de recuperacion de contrasena
    if (req.session.resetUserId) {
      delete req.session.resetUserId;
      return res.redirect("/");
    }

    // Recargar datos actualizados del usuario desde la base de datos
    const [[usuarioActualizado]] = await pool.query(
      `SELECT id_usuario, nombre_usuario, nombre_completo, rol 
       FROM usuario 
       WHERE id_usuario = ?`,
      [id_usuario]
    );

    // Regenerar la sesion para evitar fijacion de sesion y estado inconsistente
    req.session.regenerate((err) => {
      if (err) {
        console.error("Error regenerando sesion:", err.message);
        return res.redirect("/");
      }

      // Reasignar datos del usuario en la nueva sesion
      req.session.usuario = {
        id_usuario: usuarioActualizado.id_usuario,
        nombre_usuario: usuarioActualizado.nombre_usuario,
        nombre_completo: usuarioActualizado.nombre_completo,
        rol: usuarioActualizado.rol
      };

      // Guardar sesion antes de redirigir
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Error guardando sesion:", saveErr.message);
          return res.redirect("/");
        }
        return res.redirect("/dashboard");
      });
    });

  } catch (err) {
    console.error("Error al cambiar contrasena:", err.message);
    res.render("auth/changePassword", {
      layout: "main",
      title: "Cambio de Contrasena",
      error: "Error interno al actualizar la contrasena. Intente mas tarde."
    });
  }
};
