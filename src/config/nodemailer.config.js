// import nodemailer from "nodemailer";
// import { configDotenv } from "dotenv";
// import logger from "./logger.js";
// configDotenv();


// export const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: process.env.SMTP_SECURE==="true", // true for 465, false for other ports
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   }, pool: true,          // keep 5 sockets alive
//   maxConnections: 5,
//   maxMessages: 100,
//   rateDelta: 20000,    // 20 s window
//   rateLimit: 5
// });

// // email.js
// export function sendEmail({ to, subject, html, text }) {
//   if (!to) {
//     logger.error("sendEmailFast called without 'to'");
//     return; // silent return, or queue a retry job
//   }
//   transporter.sendMail(
//     {
//       from: process.env.SMTP_FROM,
//       to,
//       subject,
//       html,
//       text,
//     },
//     (err, info) => {
//       if (err) logger.error("Mail error", err);
//       else logger.info("Mail sent", info.messageId);
//     }
//   );
// }

// resend.js
import { Resend } from "resend";
import { configDotenv } from "dotenv";
import logger from "./logger.js";
configDotenv();

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html, text }) {
  if (!to) {
    logger.error("sendEmail called without 'to'");
    return;
  }

  try {
    const response = await resend.emails.send({
      from: process.env.SENDER_EMAIL, // e.g., "SpinShare <noreply@spinshare.in>"
      to,
      subject,
      html,
      text,
    });

    logger.info("Mail sent", response.id);
    return response;
  } catch (error) {
    logger.error("Mail error", error);
    return null;
  }
}