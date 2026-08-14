import { z } from "zod";

export const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const PartnerLocationSchema = z.object({
  partnerId: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().min(0).optional().default(0),
  heading: z.number().min(0).max(360).optional().default(0),
  accuracy: z.number().min(0).optional().default(0),
  timestamp: z.number().optional().default(() => Date.now()),
  bookingId: z.string().optional(),
});

export const NearbySearchQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(0.1).max(10).optional().default(5),
});

export const RouteQuerySchema = z.object({
  fromLat: z.coerce.number().min(-90).max(90),
  fromLng: z.coerce.number().min(-180).max(180),
  toLat: z.coerce.number().min(-90).max(90),
  toLng: z.coerce.number().min(-180).max(180),
});

export function validateCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
