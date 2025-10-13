import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not set in environment variables!");
}

// Create Redis connection
export const redisConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Event listeners for connection status
redisConnection.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redisConnection.on("ready", () => {
  console.log("✅ Redis is ready to use");
});

redisConnection.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

redisConnection.on("close", () => {
  console.warn("⚠️ Redis connection closed");
});

redisConnection.on("reconnecting", (time) => {
  console.log(`🔄 Redis reconnecting in ${time}ms`);
});

// Optional: Test connection immediately
(async () => {
  try {
    await redisConnection.ping();
    console.log("✅ Redis ping successful");
  } catch (err) {
    console.error("❌ Redis ping failed:", err);
  }
})();
