import mongoose from "mongoose";
import logger from "./logger.js";

const cached = (global.mongoose = global.mongoose || { conn: null, promise: null });

export async function connectDB() {
  if (cached.conn) return cached.conn;
  // in your connectDB() block
  // mongoose.set('debug', logger.debug.bind(logger)); // shows every query + ms 
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      })
      .then((m) => {
        logger.info("MongoDB connected successfully");
        m.connection.on("error", (e) => logger.error("MongoDB error:", e));
        m.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
        return m;
      })
      .catch((err) => {
        cached.promise = null;          // allow retry on next call
        logger.error("MongoDB connection failed:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}