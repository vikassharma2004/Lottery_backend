
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

    logger.info(`Mail sent successfully. ID: ${response.data.id}`);

    return response;
  } catch (error) {
    logger.error("Mail error", error);
    return null;
  }
}