// src/models/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Carga las variables del archivo .env
dotenv.config();

// Crea un pool de conexiones a MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Probar la conexión automáticamente al iniciar
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Conexión exitosa a la base de datos:", process.env.DB_NAME);
    connection.release();
  } catch (error) {
    console.error("Error de conexión a la base de datos:", error.message);
  }
})();

export default pool;
