import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: Number(process.env.PORT || 5000),
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET || "orbit_secret_key_2026",
  REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  OSRM_URL: process.env.OSRM_URL || "https://router.project-osrm.org",
  OSM_TILE_URL: process.env.OSM_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:5000",
        "http://10.0.2.2:5000",
      ],
  NEARBY_RADIUS_KM: Number(process.env.NEARBY_RADIUS_KM || 5),
  MAX_NEARBY_PARTNERS: Number(process.env.MAX_NEARBY_PARTNERS || 20),
  PARTNER_STALE_SECONDS: Number(process.env.PARTNER_STALE_SECONDS || 60),
  LOCATION_MIN_INTERVAL_SECONDS: Number(process.env.LOCATION_MIN_INTERVAL_SECONDS || 3),
  DISPATCH_OFFER_SECONDS: Number(process.env.DISPATCH_OFFER_SECONDS || 20),
  DISPATCH_BATCH_SIZE: Number(process.env.DISPATCH_BATCH_SIZE || 3),
  ROUTE_CACHE_SECONDS: Number(process.env.ROUTE_CACHE_SECONDS || 45),
};

export default ENV;
