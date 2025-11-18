import pool from "../models/db.js";

export async function registrarBitacora(req, modulo, accion, descripcion) {
  try {
    // Si no hay sesión, no se puede registrar bitácora
    if (!req.session?.usuario) return;

    const id_usuario = req.session.usuario.id_usuario;

    await pool.query(
      "CALL sp_registrar_bitacora(?, ?, ?, ?)",
      [id_usuario, modulo, accion, descripcion]
    );

  } catch (error) {
    console.error("Error registrando bitácora:", error.message);
  }
}
