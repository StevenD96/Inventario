import bcrypt from "bcryptjs";
import pool from "../models/db.js";

export const mostrarCambioClave = (req, res) => {
  res.render("auth/changePassword", { layout: "main", title: "Cambio de Contraseña" });
};

export const procesarCambioClave = async (req, res) => {
  const { nueva_contrasena, confirmar_contrasena } = req.body;
  const id_usuario = req.session.usuario?.id_usuario;

  if (!id_usuario) return res.redirect("/");

  if (nueva_contrasena !== confirmar_contrasena) {
    return res.render("auth/changePassword", {
      layout: "main",
      title: "Cambio de Contraseña",
      error: "Las contraseñas no coinciden"
    });
  }

  const cumple = nueva_contrasena.length >= 8 &&
                 /[A-Z]/.test(nueva_contrasena) &&
                 /[0-9]/.test(nueva_contrasena) &&
                 /[!@#$%^&*]/.test(nueva_contrasena);

  if (!cumple) {
    return res.render("auth/changePassword", {
      layout: "main",
      title: "Cambio de Contraseña",
      error: "La contraseña no cumple con los requisitos de seguridad."
    });
  }

  const hash = await bcrypt.hash(nueva_contrasena, 10);

  try {
    await pool.query(
      `UPDATE Usuario 
       SET contrasena_hash = ?, cambio_contrasena_hash = FALSE, actualizado_en = NOW() 
       WHERE id_usuario = ?`,
      [hash, id_usuario]
    );

    await pool.query("CALL sp_registrar_bitacora(?, ?, ?, ?)", [
      id_usuario,
      "Usuarios",
      "EDITAR",
      "Cambio de contraseña exitoso"
    ]);

    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error al cambiar contraseña:", err.message);
    res.render("auth/changePassword", {
      layout: "main",
      title: "Cambio de Contraseña",
      error: "Error interno al actualizar la contraseña."
    });
  }
};
