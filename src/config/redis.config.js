import Redis from "ioredis"
import IORedis from "ioredis";
import { configDotenv } from "dotenv";

configDotenv();
export const redisConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

