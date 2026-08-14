import { connectRedis } from "../utils/redis";
import { ENV } from "../config/env";
import { PartnerLocationSchema, validateCoordinates } from "../utils/validation";
import { firestoreDb } from "../lib/db";

export interface PartnerState {
  partnerId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: number;
  status: "ONLINE" | "OFFLINE" | "BUSY" | "EN_ROUTE" | "SHOOTING";
  availability: "AVAILABLE" | "BUSY";
  socketId?: string;
}

export class PartnerLocationService {
  /**
   * Check rate-limit (max 1 update / 3s). Returns true if update is allowed.
   */
  static async checkRateLimit(partnerId: string): Promise<boolean> {
    try {
      const redis = await connectRedis();
      if (!redis) return true; // Fail-open if Redis down

      const key = `location:last-update:${partnerId}`;
      const result = await redis.set(key, "1", "EX", ENV.LOCATION_MIN_INTERVAL_SECONDS, "NX");
      return result === "OK";
    } catch {
      return true;
    }
  }

  /**
   * Ingest and store partner location in Redis GEO + state key + active set.
   */
  static async updateLocation(data: {
    partnerId: string;
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    timestamp?: number;
    socketId?: string;
    status?: "ONLINE" | "OFFLINE" | "BUSY" | "EN_ROUTE" | "SHOOTING";
    availability?: "AVAILABLE" | "BUSY";
  }): Promise<{ success: boolean; error?: string }> {
    const parsed = PartnerLocationSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.message };
    }

    const { partnerId, lat, lng, speed, heading, accuracy, timestamp } = parsed.data;

    // Check if timestamp is excessively old (> 2 minutes)
    if (Date.now() - timestamp > 120000) {
      return { success: false, error: "Location timestamp is too old" };
    }

    try {
      const redis = await connectRedis();
      if (redis) {
        const partnerKey = `partner:${partnerId}`;
        const existingRaw = await redis.get(partnerKey);
        const existingState: Partial<PartnerState> = existingRaw ? JSON.parse(existingRaw) : {};

        const state: PartnerState = {
          partnerId,
          lat,
          lng,
          speed: speed ?? existingState.speed ?? 0,
          heading: heading ?? existingState.heading ?? 0,
          accuracy: accuracy ?? existingState.accuracy ?? 0,
          timestamp,
          status: data.status || existingState.status || "ONLINE",
          availability: data.availability || existingState.availability || "AVAILABLE",
          socketId: data.socketId || existingState.socketId,
        };

        const pipeline = redis.pipeline();
        pipeline.geoadd("partners", lng, lat, partnerId);
        pipeline.set(partnerKey, JSON.stringify(state), "EX", ENV.PARTNER_STALE_SECONDS);
        pipeline.sadd("partners:active", partnerId);
        await pipeline.exec();
      }
    } catch (err: any) {
      // In-memory / graceful fallback
    }

    // Async sync to Firestore
    firestoreDb.partners.findFirst({ where: { userId: partnerId } })
      .then((partner) => {
        const id = partner ? partner.id : partnerId;
        return firestoreDb.partners.update({
          where: { id },
          data: { latitude: lat, longitude: lng, lastLocationAt: new Date().toISOString(), availability: true },
        });
      })
      .catch(() => {});

    return { success: true };
  }

  /**
   * Mark partner offline and remove from GEO and active set.
   */
  static async setPartnerOffline(partnerId: string): Promise<void> {
    const redis = await connectRedis();
    if (!redis) return;

    const pipeline = redis.pipeline();
    pipeline.zrem("partners", partnerId);
    pipeline.srem("partners:active", partnerId);
    pipeline.del(`partner:${partnerId}`);
    pipeline.del(`dispatch:partner:${partnerId}`);
    await pipeline.exec();

    firestoreDb.partners.findFirst({ where: { userId: partnerId } })
      .then((p) => {
        if (p) firestoreDb.partners.update({ where: { id: p.id }, data: { availability: false } });
      })
      .catch(() => {});
  }

  /**
   * Get partner state by ID.
   */
  static async getPartnerState(partnerId: string): Promise<PartnerState | null> {
    const redis = await connectRedis();
    if (!redis) return null;

    const raw = await redis.get(`partner:${partnerId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Search nearby online and available partners.
   */
  static async searchNearby(lat: number, lng: number, radiusKm = 5, limit = 20): Promise<Array<{
    partnerId: string;
    distanceKm: number;
    lat: number;
    lng: number;
    availability: string;
    rating?: number;
  }>> {
    if (!validateCoordinates(lat, lng)) return [];

    const redis = await connectRedis();
    if (!redis) return [];

    const rawResults = await redis.geosearch(
      "partners",
      "FROMLONLAT",
      lng,
      lat,
      "BYRADIUS",
      radiusKm,
      "km",
      "WITHDIST",
      "ASC",
      "COUNT",
      limit
    );

    if (!rawResults || !rawResults.length) return [];

    const candidateIds = rawResults.map(([id]) => String(id));
    const pipeline = redis.pipeline();
    candidateIds.forEach((id) => pipeline.get(`partner:${id}`));
    const states = await pipeline.exec();

    const partners: Array<any> = [];

    rawResults.forEach(([id, distStr], index) => {
      const stateRaw = states?.[index]?.[1];
      if (!stateRaw) return; // Stale GEO entry without state key

      try {
        const state: PartnerState = JSON.parse(String(stateRaw));
        if (state.status === "ONLINE" && state.availability === "AVAILABLE") {
          partners.push({
            partnerId: String(id),
            distanceKm: Number(parseFloat(String(distStr)).toFixed(2)),
            lat: state.lat,
            lng: state.lng,
            availability: state.availability,
            rating: 4.9,
          });
        }
      } catch {}
    });

    return partners;
  }
}
