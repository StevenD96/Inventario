// src/app.js
import express from "express";
import { engine } from "express-handlebars";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import session from "express-session";

// Rutas (Mantenemos tus rutas tal cual)
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bitacoraRoutes from "./routes/bitacoraRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import tuberiaRoutes from "./routes/tuberiaRoutes.js"; 
import accesoriosRoutes from "./routes/accesoriosRoutes.js"; 
import pegamentosRoutes from "./routes/pegamentosRoutes.js"; 
import cloroRoutes from "./routes/cloroRoutes.js"; 
import medidoresRoutes from "./routes/medidoresRoutes.js"; 
import herramientasRoutes from "./routes/herramientasRoutes.js"; 
import limpiezaRoutes from "./routes/limpiezaRoutes.js"; 
import { handlebarsHelpers } from "./utils/handlebarsHelpers.js";
import inventarioRoutes from "./routes/inventarioRoutes.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handlebars con helpers personalizados
app.engine(".hbs", engine({
  extname: ".hbs",
  helpers: {
    ...handlebarsHelpers,
    eq: (a, b) => a === b,
    gt: (a, b) => a > b,
    rolTexto: (rol) => {
      if (!rol) return "";
      return rol === "Admin" ? "Administrador" : "Usuario";
    }
  }
}));

app.set("view engine", ".hbs");
//app.set("views", path.join(__dirname, "views"));
app.set("views", path.join(process.cwd(), "src", "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- AJUSTE PARA RENDER (TRUST PROXY) ---
// Render usa un proxy inverso. Esto asegura que las cookies de sesión funcionen bien.
app.set('trust proxy', 1);

// Sesión
app.use(session({
  secret: process.env.SESSION_SECRET || "inventarioCMD2025",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60, // Aumentado a 1 hora para mejor experiencia
    secure: process.env.NODE_ENV === "production" // Solo envía cookies sobre HTTPS en producción
  }
}));

// Archivos estáticos
app.use(express.static(path.join(__dirname, "../public")));

app.use((req, res, next) => {
  res.locals.mensaje = req.session.mensaje || null;
  delete req.session.mensaje;
  next();
});

// Rutas
app.use("/", authRoutes);
app.use("/usuarios", userRoutes);
app.use("/bitacora", bitacoraRoutes);
app.use("/tuberia", tuberiaRoutes);
app.use("/accesorios", accesoriosRoutes);
app.use("/pegamentos", pegamentosRoutes);
app.use("/cloro", cloroRoutes);
app.use("/medidores", medidoresRoutes);
app.use("/herramientas", herramientasRoutes);
app.use("/limpieza", limpiezaRoutes);
app.use("/inventario", inventarioRoutes);
app.use("/dashboard", dashboardRoutes);

// --- AJUSTE DE PUERTO PARA RENDER ---
const PORT = process.env.PORT || 3010;
// Eliminamos el "http://localhost" del log ya que en la nube tendrá su propia URL
app.listen(PORT, () => console.log(`Servidor listo en el puerto ${PORT}`));