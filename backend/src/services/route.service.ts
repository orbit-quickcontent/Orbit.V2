import { connectRedis } from "../utils/redis";
import { ENV } from "../config/env";
import { validateCoordinates } from "../utils/validation";

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  estimatedMinutes: number;
  geometry: {
    type: "LineString";
    coordinates: Array<[number, number]>;
  };
  cached?: boolean;
  fallback?: boolean;
}

export class RouteService {
  /**
   * Calculate driving route and ETA between two coordinates with caching & fallback.
   */
  static async getRoute(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): Promise<RouteResult> {
    if (!validateCoordinates(fromLat, fromLng) || !validateCoordinates(toLat, toLng)) {
      throw new Error("Invalid coordinates provided for route calculation");
    }

    // 1. Check Redis Route Cache (rounded to ~100m precision to maximize hits)
    const cacheKey = `route:${fromLat.toFixed(3)}_${fromLng.toFixed(3)}_${toLat.toFixed(3)}_${toLng.toFixed(3)}`;
    const redis = await connectRedis();

    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          return { ...parsed, cached: true };
        }
      } catch {}
    }

    // 2. Call OSRM API via native fetch
    try {
      const url = `${ENV.OSRM_URL}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=false`;
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        const data: any = await response.json();
        const route = data?.routes?.[0];

        if (route) {
          const result: RouteResult = {
            distanceMeters: Math.round(route.distance),
            durationSeconds: Math.round(route.duration),
            estimatedMinutes: Math.max(1, Math.ceil(route.duration / 60)),
            geometry: route.geometry,
          };

          if (redis) {
            redis.set(cacheKey, JSON.stringify(result), "EX", ENV.ROUTE_CACHE_SECONDS).catch(() => {});
          }

          return result;
        }
      }
    } catch (err: any) {
      console.warn("[RouteService] OSRM call failed, falling back to Haversine calculation:", err.message);
    }

    // 3. Fallback: Haversine calculation with realistic driving speed (~28 km/h)
    return this.calculateHaversineFallback(fromLat, fromLng, toLat, toLng);
  }

  /**
   * Haversine mathematical fallback when OSRM server is unreachable or rate-limited.
   */
  static calculateHaversineFallback(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): RouteResult {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (fromLat * Math.PI) / 180;
    const φ2 = (toLat * Math.PI) / 180;
    const Δφ = ((toLat - fromLat) * Math.PI) / 180;
    const Δλ = ((toLng - fromLng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightDistMeters = R * c;

    // Driving distance factor (~1.3x straight-line distance in cities)
    const drivingDistanceMeters = Math.round(straightDistMeters * 1.3);
    const avgSpeedMps = 7.77; // ~28 km/h city average
    const durationSeconds = Math.round(drivingDistanceMeters / avgSpeedMps);
    const estimatedMinutes = Math.max(1, Math.ceil(durationSeconds / 60));

    return {
      distanceMeters: drivingDistanceMeters,
      durationSeconds,
      estimatedMinutes,
      geometry: {
        type: "LineString",
        coordinates: [
          [fromLng, fromLat],
          [toLng, toLat],
        ],
      },
      fallback: true,
    };
  }
}
