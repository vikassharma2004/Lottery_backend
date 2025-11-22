import mongoose from "mongoose";
import logger from "./logger.js";
export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    logger.info('MongoDB connected successfully ');

    // Optional: Listen to connection events
    mongoose.connection.on('error', (err) => {
     logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected ');
    });

    return mongoose.connection;
  } catch (err) {
    logger.error('Failed to connect to MongoDB:', err);
    throw err;
  }
}


