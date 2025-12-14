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
import tuberiaRoutes from "./routes/tuberiaRoutes.js"; //Ruta para tuberias
import accesoriosRoutes from "./routes/accesoriosRoutes.js"; //Ruta para accesorios
import pegamentosRoutes from "./routes/pegamentosRoutes.js"; //Ruta para pegamentos
import cloroRoutes from "./routes/cloroRoutes.js"; //Ruta para cloro
import medidoresRoutes from "./routes/medidoresRoutes.js"; //Ruta medidores
import herramientasRoutes from "./routes/herramientasRoutes.js";
import { handlebarsHelpers } from "./utils/handlebarsHelpers.js";
import inventarioRoutes from "./routes/inventarioRoutes.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handlebars con helpers
// Handlebars con helpers personalizados
/*app.engine(".hbs", engine({
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
}));*/
app.engine(".hbs", engine({
  extname: ".hbs",
  helpers: {
    ...handlebarsHelpers,     // ← importa tus helpers personalizados
    eq: (a, b) => a === b,    // ← si quieres mantener estos también
    gt: (a, b) => a > b,
    rolTexto: (rol) => {
      if (!rol) return "";
      return rol === "Admin" ? "Administrador" : "Usuario";
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

app.use((req, res, next) => {
  res.locals.mensaje = req.session.mensaje || null;
  delete req.session.mensaje;
  next();
});

// Rutas — orden correcto
app.use("/", authRoutes);              // LOGIN primero
app.use("/usuarios", userRoutes);      // usuarios
app.use("/bitacora", bitacoraRoutes);  // bitácora
app.use("/tuberia", tuberiaRoutes);    // tubería
app.use("/accesorios", accesoriosRoutes); //accesorios
app.use("/pegamentos", pegamentosRoutes);//pegamentos
app.use("/cloro", cloroRoutes);//cloro
app.use("/medidores", medidoresRoutes); //medidores
app.use("/herramientas", herramientasRoutes); //herramientas
app.use("/inventario", inventarioRoutes); //inventario
app.use("/dashboard", dashboardRoutes); // dashboard al final y con prefijo

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
