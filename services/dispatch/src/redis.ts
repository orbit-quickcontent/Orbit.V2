import Redis from 'ioredis';
import dotenv from 'dotenv';
import { GeoLocation, PartnerPresence } from './types';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    console.log(`[Redis] Connection retry #${times} in ${delay}ms...`);
    return delay;
  }
});

redis.on('connect', () => console.log('[Redis] Connected successfully'));
redis.on('error', (err) => console.error('[Redis] Error:', err.message));

// Redis Key Constants
export const KEYS = {
  GEO_ONLINE_PARTNERS: 'partners:online:geo',
  PARTNER_PRESENCE: (id: string) => `partner:${id}:presence`,
  BOOKING_OFFERED_PARTNERS: (bookingId: string) => `booking:${bookingId}:offered`,
  BOOKING_DATA: (bookingId: string) => `booking:${bookingId}:data`,
  PARTNER_METRICS: (id: string) => `partner:${id}:metrics`
};

export async function addPartnerLocationGeo(
  partnerId: string,
  location: GeoLocation
): Promise<void> {
  const { longitude, latitude } = location;
  await redis.geoadd(
    KEYS.GEO_ONLINE_PARTNERS,
    longitude,
    latitude,
    partnerId
  );
}

export async function removePartnerGeo(partnerId: string): Promise<void> {
  await redis.zrem(KEYS.GEO_ONLINE_PARTNERS, partnerId);
}

export interface GeoSearchResult {
  partnerId: string;
  distanceKm: number;
}

export async function searchNearbyPartnersGeo(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<GeoSearchResult[]> {
  try {
    // ioredis georadius
    const results = (await redis.georadius(
      KEYS.GEO_ONLINE_PARTNERS,
      lng,
      lat,
      radiusKm,
      'km',
      'WITHDIST',
      'ASC'
    )) as Array<[string, string]>;

    if (!results || !Array.isArray(results)) {
      return [];
    }

    return results.map(([partnerId, distanceStr]) => ({
      partnerId,
      distanceKm: parseFloat(distanceStr)
    }));
  } catch (err) {
    console.error('[Redis GEO] Radius search failed:', err);
    return [];
  }
}

export async function setPartnerPresence(
  partnerId: string,
  presence: PartnerPresence
): Promise<void> {
  await redis.set(
    KEYS.PARTNER_PRESENCE(partnerId),
    JSON.stringify(presence),
    'EX',
    86400 // 24 hour TTL
  );
}

export async function getPartnerPresence(
  partnerId: string
): Promise<PartnerPresence | null> {
  const data = await redis.get(KEYS.PARTNER_PRESENCE(partnerId));
  if (!data) return null;
  try {
    return JSON.parse(data) as PartnerPresence;
  } catch {
    return null;
  }
}

export async function markPartnerOfferedForBooking(
  bookingId: string,
  partnerId: string
): Promise<void> {
  const key = KEYS.BOOKING_OFFERED_PARTNERS(bookingId);
  await redis.sadd(key, partnerId);
  await redis.expire(key, 1800); // 30 mins TTL
}

export async function isPartnerOfferedForBooking(
  bookingId: string,
  partnerId: string
): Promise<boolean> {
  const key = KEYS.BOOKING_OFFERED_PARTNERS(bookingId);
  const isMember = await redis.sismember(key, partnerId);
  return isMember === 1;
}

export async function recordPartnerResponseMetric(
  partnerId: string,
  action: 'accept' | 'reject' | 'timeout'
): Promise<void> {
  const key = KEYS.PARTNER_METRICS(partnerId);
  if (action === 'accept') {
    await redis.hincrby(key, 'accepted', 1);
  } else if (action === 'reject') {
    await redis.hincrby(key, 'rejected', 1);
  } else if (action === 'timeout') {
    await redis.hincrby(key, 'timedOut', 1);
  }
}

export async function getPartnerResponseScore(partnerId: string): Promise<number> {
  const key = KEYS.PARTNER_METRICS(partnerId);
  const metrics = await redis.hgetall(key);
  const accepted = parseInt(metrics.accepted || '0', 10);
  const rejected = parseInt(metrics.rejected || '0', 10);
  const timedOut = parseInt(metrics.timedOut || '0', 10);
  const total = accepted + rejected + timedOut;

  if (total === 0) return 0.5; // neutral score default
  return accepted / total;
}
