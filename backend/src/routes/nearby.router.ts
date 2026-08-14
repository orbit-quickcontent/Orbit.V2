import { Router, Request, Response } from "express";
import { PartnerLocationService } from "../services/partner-location.service";
import { NearbySearchQuerySchema } from "../utils/validation";

const router = Router();

router.get("/partners/nearby", async (req: Request, res: Response) => {
  try {
    const parseResult = NearbySearchQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid search query parameters", details: parseResult.error.format() });
    }

    const { lat, lng, radius } = parseResult.data;
    const partners = await PartnerLocationService.searchNearby(lat, lng, radius);

    return res.status(200).json({
      success: true,
      count: partners.length,
      partners,
    });
  } catch (err: any) {
    console.error("[NearbyRouter Error]", err.message);
    return res.status(500).json({ error: "Failed to search nearby partners", details: err.message });
  }
});

// Alias for /api/nearby
router.get("/nearby", async (req: Request, res: Response) => {
  try {
    const parseResult = NearbySearchQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid search query parameters", details: parseResult.error.format() });
    }

    const { lat, lng, radius } = parseResult.data;
    const partners = await PartnerLocationService.searchNearby(lat, lng, radius);

    return res.status(200).json({
      success: true,
      count: partners.length,
      partners,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to search nearby partners" });
  }
});

export default router;
