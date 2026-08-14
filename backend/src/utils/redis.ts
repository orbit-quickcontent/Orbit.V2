import Redis from "ioredis";
import { ENV } from "../config/env";

let redisClient: Redis | null = null;
let isConnected = false;

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis(ENV.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy: (times) => (times <= 2 ? 100 : null),
    });

    redisClient.on("connect", () => {
      isConnected = true;
      console.log("[Redis] Connected successfully to:", ENV.REDIS_URL);
    });

    redisClient.on("ready", () => {
      isConnected = true;
    });

    redisClient.on("error", (err) => {
      isConnected = false;
      // Suppress noisy logs in test/offline environment
      if (process.env.NODE_ENV !== "test") {
        console.warn("[Redis Warning] Connection error:", err.message);
      }
    });

    redisClient.on("close", () => {
      isConnected = false;
    });
  } catch (err: any) {
    redisClient = null;
  }

  return redisClient;
}

export async function connectRedis(): Promise<Redis | null> {
  const client = getRedisClient();
  if (!client) return null;
  if (client.status === "wait") {
    try {
      await client.connect();
    } catch {
      return null;
    }
  }
  if (client.status !== "ready" && client.status !== "connect") {
    return null;
  }
  return client;
}

export function isRedisConnected(): boolean {
  return isConnected || (redisClient !== null && redisClient.status === "ready");
}
