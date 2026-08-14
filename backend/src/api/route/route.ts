import { Request, Response } from "express";
import axios from "axios";

export async function GET(req: Request, res: Response) {
  try {
    const fromLat = parseFloat(req.query.fromLat as string);
    const fromLng = parseFloat(req.query.fromLng as string);
    const toLat = parseFloat(req.query.toLat as string);
    const toLng = parseFloat(req.query.toLng as string);

    if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
      return res.status(400).json({ error: "Valid fromLat, fromLng, toLat, toLng query params are required" });
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

    let responseData: any = null;
    try {
      const response = await axios.get(osrmUrl, { timeout: 4000 });
      if (response.data?.routes?.length > 0) {
        const route = response.data.routes[0];
        responseData = {
          success: true,
          distanceMeters: Math.round(route.distance),
          distanceKm: parseFloat((route.distance / 1000).toFixed(2)),
          durationSeconds: Math.round(route.duration),
          etaMinutes: Math.max(1, Math.ceil(route.duration / 60)),
          geometry: route.geometry,
        };
      }
    } catch (osrmErr: any) {
      console.warn("[OSRM API error / fallback]", osrmErr.message);
    }

    if (!responseData) {
      const R = 6371;
      const dLat = ((toLat - fromLat) * Math.PI) / 180;
      const dLng = ((toLng - fromLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((fromLat * Math.PI) / 180) *
          Math.cos((toLat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distKm = R * c;
      const durationSec = Math.round((distKm / 25) * 3600);

      responseData = {
        success: true,
        fallback: true,
        distanceMeters: Math.round(distKm * 1000),
        distanceKm: parseFloat(distKm.toFixed(2)),
        durationSeconds: durationSec,
        etaMinutes: Math.max(1, Math.ceil(durationSec / 60)),
        geometry: {
          type: "LineString",
          coordinates: [
            [fromLng, fromLat],
            [toLng, toLat],
          ],
        },
      };
    }

    return res.json(responseData);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
