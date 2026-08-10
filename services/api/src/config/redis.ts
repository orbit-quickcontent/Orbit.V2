import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT, 10),
  password: env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
});

export const REDIS_GEO_KEY = 'partners:online';

export async function addPartnerToGeoSet(partnerId: string, latitude: number, longitude: number): Promise<void> {
  // Redis GEOADD member syntax: GEOADD key longitude latitude member
  await redis.geoadd(REDIS_GEO_KEY, longitude, latitude, partnerId);
}

export async function removePartnerFromGeoSet(partnerId: string): Promise<void> {
  await redis.zrem(REDIS_GEO_KEY, partnerId);
}

export interface GeoSearchResult {
  partnerId: string;
  distanceKm: number;
}

export async function findNearbyPartnerIds(
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<GeoSearchResult[]> {
  try {
    // Redis GEOSEARCH command: GEOSEARCH key FROMLONLAT lng lat BYRADIUS radius km WITHDIST ASC
    const results = (await redis.call(
      'GEOSEARCH',
      REDIS_GEO_KEY,
      'FROMLONLAT',
      longitude.toString(),
      latitude.toString(),
      'BYRADIUS',
      radiusKm.toString(),
      'km',
      'WITHDIST',
      'ASC'
    )) as [string, string][];

    if (!Array.isArray(results)) return [];

    return results.map(([partnerId, distStr]) => ({
      partnerId,
      distanceKm: parseFloat(distStr),
    }));
  } catch (error) {
    // Fallback for older Redis versions without GEOSEARCH
    const results = (await redis.georadius(
      REDIS_GEO_KEY,
      longitude,
      latitude,
      radiusKm,
      'km',
      'WITHDIST',
      'ASC'
    )) as [string, string][];

    if (!Array.isArray(results)) return [];

    return results.map(([partnerId, distStr]) => ({
      partnerId,
      distanceKm: parseFloat(distStr),
    }));
  }
}
