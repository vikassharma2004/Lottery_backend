import cron from "node-cron";
import { User } from "../models/User.model.js";
import { Payment } from "../models/payment.model.js";
import logger from "../config/logger.js"; // <-- USE THE DAMN LOGGER

// ------------------- Cron Job 1: Delete unverified users older than 2 days -------------------
cron.schedule("0 0 * * *", async () => {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  try {
    const result = await User.deleteMany({
      isVerified: false,
      createdAt: { $lt: twoDaysAgo },
    });

    logger.info(
      `🧹 Deleted ${result.deletedCount} unverified users older than 2 days`
    );
  } catch (err) {
    logger.error({
      message: "Error deleting unverified users",
      error: err.message,
      stack: err.stack,
    });
  }
});

// ------------------- Cron Job 2: Delete payment records older than 8 days -------------------
cron.schedule("0 1 * * *", async () => {
  const eightDaysAgo = new Date();
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

  try {
    const result = await Payment.deleteMany({
      createdAt: { $lt: eightDaysAgo },
    });

    logger.info(
      ` Deleted ${result.deletedCount} payment records older than 8 days`
    );
  } catch (err) {
    logger.error({
      message: "Error deleting old payment records",
      error: err.message,
      stack: err.stack,
    });
  }
});

// ------------------- Cron Job 3: Keep Render server awake -------------------
cron.schedule("*/14 * * * *", async () => {
  try {
    const response = await fetch("https://lottery-backend-1-a0sy.onrender.com");

    if (response.ok) {
      logger.info(" Ping successful (Render alive)");
    } else {
      logger.warn(`Ping failed with status: ${response.status}`);
    }
  } catch (err) {
    logger.error({
      message: "Error pinging Render server",
      error: err.message,
      stack: err.stack,
    });
  }
});
