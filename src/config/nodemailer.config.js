import nodemailer from "nodemailer";
import { configDotenv } from "dotenv";

configDotenv();

// console.log("process.env.SMTP_HOST",process.env.SMTP_HOST)
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE==="true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // ✅ validate 'to' is defined
    if (!to) {
      console.error("sendEmail called without 'to':", { to, subject });
      throw new Error("No recipient defined");
    }
    console.log("Sending email to:", to, subject);

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM, // keep as plain string, no need for <>
      to,
      subject,
      html,
      text,
    });

    return info;
  } catch (err) {
    console.error("Email send error:", err);
    throw err;
  }
};
