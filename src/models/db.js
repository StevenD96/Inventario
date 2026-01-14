// src/models/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // SSL configurado para Aiven
  ssl: process.env.DB_SSL === "true" 
    ? { rejectUnauthorized: false } 
    : undefined,

  // --- CONFIGURACIÓN DE RESILIENCIA ---
  waitForConnections: true,
  connectionLimit: 10,     // Ideal para no saturar la RAM de Aiven
  maxIdle: 10,             // Conexiones inactivas máximas
  idleTimeout: 60000,      // Las conexiones inactivas expiran tras 60s
  queueLimit: 0,

  // --- KEEPALIVE: El "latido" para que Aiven no se apague ---
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000 // Envía un paquete cada 10 segundos
});

// Probar conexión y manejar errores críticos del pool
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Conexión exitosa a Aiven:", process.env.DB_NAME);
    connection.release();
  } catch (error) {
    console.error("Error de conexión inicial:", error.message);
  }
})();

// Manejador de errores del pool para evitar que la app se caiga
pool.on('error', (err) => {
  console.error(' Error inesperado en el pool de MySQL:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Conexión perdida. El pool intentará reconectar en la próxima consulta.');
  }
});

export default pool;