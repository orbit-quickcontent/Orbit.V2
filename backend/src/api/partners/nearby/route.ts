import { Request, Response } from "express";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
});
redis.connect().catch(() => {});

export async function GET(req: Request, res: Response) {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat((req.query.radius as string) || "5");

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: "Valid lat and lng query params are required" });
    }

    let partners: any[] = [];

    if (redis.status === "ready") {
      try {
        const results: any = await redis.geosearch(
          "partners:online",
          "FROMLONLAT",
          lng,
          lat,
          "BYRADIUS",
          radius,
          "km",
          "WITHDIST",
          "WITHCOORD",
          "ASC",
          "COUNT",
          20
        );

        partners = await Promise.all(
          results.map(async ([id, dist, coords]: any) => {
            const rawDetails = await redis.get(`partner:${id}`);
            let details: any = {};
            if (rawDetails) {
              try { details = JSON.parse(rawDetails); } catch (_) {}
            }
            return {
              partnerId: id,
              distanceKm: parseFloat(Number(dist).toFixed(2)),
              lat: coords ? parseFloat(coords[1]) : details.lat || null,
              lng: coords ? parseFloat(coords[0]) : details.lng || null,
              speed: details.speed || 0,
              heading: details.heading || 0,
              lastSeen: details.ts || Date.now(),
            };
          })
        );
      } catch (err: any) {
        console.warn("[Redis GeoSearch]", err.message);
      }
    }

    return res.json(partners);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
