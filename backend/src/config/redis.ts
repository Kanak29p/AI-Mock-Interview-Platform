import Redis from "ioredis";
import { config } from "./env";

let redisClient: Redis | null = null;

try {
  if (config.REDIS_URL) {
    redisClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
    });
  } else {
    redisClient = new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
    });
  }

  redisClient.on("connect", () => {
    console.log("Connected to Redis successfully");
  });

  redisClient.on("error", (err) => {
    console.warn("Redis connection warning / offline:", err.message);
  });
} catch (err) {
  console.warn("Could not initialize Redis client:", err);
}

export const redis = redisClient;
