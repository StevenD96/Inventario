// src/utils/mailer.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export async function enviarCorreo({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST_GMAIL,
    port: process.env.MAIL_PORT_GMAIL,
    secure: process.env.MAIL_SECURE_GMAIL === "true",
    auth: {
      user: process.env.MAIL_USER_GMAIL,
      pass: process.env.MAIL_PASS_GMAIL
    }
  });

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM_GMAIL,
      to,
      subject,
      html
    });
    console.log(`Correo enviado correctamente a ${to}`);
    return true;
  } catch (error) {
    console.error("Error enviando correo:", error.message);
    return false;
  }
}
