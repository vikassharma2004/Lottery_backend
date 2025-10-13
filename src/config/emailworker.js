import { Worker } from "bullmq";
import { redisConnection } from "./redis.config.js";
import { sendEmail } from "./nodemailer.config.js";

const worker = new Worker(
  "emailQueue",
  async (job) => {
    const { email, type, payload } = job.data;

    switch (type) {
      case "adminLogin":
        await sendEmail({
          to: email,
          subject: "New Admin Login Detected",
          html: `
            <!DOCTYPE html>
            <html>
              <body>
                <h2>New Login Detected</h2>
                <p>Hello, ${payload.userEmail}</p>
                <p>A new login to your admin account was detected. Here are the details:</p>
                <ul>
                  <li><b>Device Name:</b> ${payload.deviceName}</li>
                  <li><b>Platform:</b> ${payload.platform}</li>
                  <li><b>Timezone:</b> ${payload.timezone}</li>
                  <li><b>Login Time:</b> ${payload.loginTime}</li>
                </ul>
                <p>If this was you, ignore this message. Otherwise, revoke your sessions immediately.</p>
                <hr/>
                <p style="font-size:12px; color:gray;">
                  © ${new Date().getFullYear()} YourAppName. All rights reserved.
                </p>
              </body>
            </html>
          `,
        });
        break;

      default:
        console.warn(`⚠️ Unknown email type: ${type}`);
    }
  },
  { connection: redisConnection }
);

worker.on("completed", (job) => console.log(`✅ Email job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`❌ Email job ${job.id} failed:`, err));
