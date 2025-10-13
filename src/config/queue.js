import { Queue } from "bullmq";
import { redisConnection } from "./redis.config.js";

export const emailQueue = new Queue("emailQueue", {
  connection: redisConnection,
});
