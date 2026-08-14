import { connectRedis } from "../utils/redis";
import { ENV } from "../config/env";
import { notifyClient } from "./websocket.service";

let cleanupInterval: NodeJS.Timeout | null = null;

export function startCleanupWorker(): void {
  if (cleanupInterval) return;

  console.log("[CleanupWorker] Stale partner cleanup worker started (15s interval)");

  cleanupInterval = setInterval(async () => {
    try {
      const redis = await connectRedis();
      if (!redis) return;

      const activePartnerIds = await redis.smembers("partners:active");
      if (!activePartnerIds || activePartnerIds.length === 0) return;

      const now = Date.now();
      const staleThresholdMs = ENV.PARTNER_STALE_SECONDS * 1000;

      const pipeline = redis.pipeline();
      activePartnerIds.forEach((id) => pipeline.get(`partner:${id}`));
      const results = await pipeline.exec();

      const staleIds: string[] = [];

      activePartnerIds.forEach((partnerId, index) => {
        const stateRaw = results?.[index]?.[1];
        if (!stateRaw) {
          // Key already expired in Redis
          staleIds.push(partnerId);
          return;
        }

        try {
          const state = JSON.parse(String(stateRaw));
          if (now - state.timestamp > staleThresholdMs) {
            staleIds.push(partnerId);
          }
        } catch {
          staleIds.push(partnerId);
        }
      });

      if (staleIds.length > 0) {
        console.log(`[CleanupWorker] Removing ${staleIds.length} stale partners from Redis GEO:`, staleIds);

        const cleanPipeline = redis.pipeline();
        staleIds.forEach((id) => {
          cleanPipeline.zrem("partners", id);
          cleanPipeline.srem("partners:active", id);
          cleanPipeline.del(`partner:${id}`);
          cleanPipeline.del(`dispatch:partner:${id}`);
        });
        await cleanPipeline.exec();
      }
    } catch (err: any) {
      console.warn("[CleanupWorker Warning]", err.message);
    }
  }, 15000);
}

export function stopCleanupWorker(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
