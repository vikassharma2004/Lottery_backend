import cron from 'node-cron';
import { User } from '../models/User.model.js';
import { Payment } from '../models/payment.model.js';

// ------------------- Cron Job 1: Delete unverified users older than 2 days -------------------
cron.schedule('0 0 * * *', async () => {
  // Runs every day at 00:00
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  try {
    const result = await User.deleteMany({
      isVerified: false,
      createdAt: { $lt: twoDaysAgo },
    });
    console.log(`Deleted ${result.deletedCount} unverified users older than 2 days.`);
  } catch (err) {
    console.error('Error deleting unverified users:', err);
  }
});

// ------------------- Cron Job 2: Delete payment records older than 8 days -------------------
cron.schedule('0 1 * * *', async () => {
  // Runs every day at 01:00
  const eightDaysAgo = new Date();
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

  try {
    const result = await Payment.deleteMany({
      createdAt: { $lt: eightDaysAgo },
    });
    console.log(`Deleted ${result.deletedCount} payment records older than 8 days.`);
  } catch (err) {
    console.error('Error deleting old payment records:', err);
  }
});
