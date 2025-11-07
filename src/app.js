// src/app.js
import express from "express";
import { engine } from "express-handlebars";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import session from "express-session";

// Rutas
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bitacoraRoutes from "./routes/bitacoraRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handlebars con helpers
// Handlebars con helpers personalizados
app.engine(".hbs", engine({
  extname: ".hbs",
  helpers: {
    eq: (a, b) => a === b,
    gt: (a, b) => a > b,
    rolTexto: (rol) => {
      //if (rol === "Admin") return "Administrador";
      //if (rol === "User") return "Usuario";
      //return rol;
      if (!rol) return "";
      return rol === "Admin" ? "Administrador" : "Usuario"
    }
  }
}));


app.set("view engine", ".hbs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sesión
app.use(session({
  secret: process.env.SESSION_SECRET || "inventarioCMD2025",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 30 }
}));

// Archivos estáticos
app.use(express.static(path.join(__dirname, "../public")));

// Rutas
app.use("/", authRoutes);
app.use("/", dashboardRoutes);
app.use("/usuarios", userRoutes);
app.use("/bitacora", bitacoraRoutes);

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
