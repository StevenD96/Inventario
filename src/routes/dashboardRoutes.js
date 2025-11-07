import express from "express";
import { verificarSesion } from "../middleware/authMiddleware.js";
import { cerrarSesion } from "../controllers/authController.js";


const router = express.Router();

router.get("/dashboard", verificarSesion, (req, res) => {
  res.render("dashboard", {
    layout: "app",
    title: "Panel Principal",
    usuario: req.session.usuario
  });
});


router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});


export default router;
