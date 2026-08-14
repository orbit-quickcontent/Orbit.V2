import { Router, Request, Response } from "express";
import { PartnerLocationService } from "../services/partner-location.service";
import { firestoreDb } from "../lib/db";

const router = Router();

router.post("/partners/status", async (req: Request, res: Response) => {
  try {
    const partnerId = (req as any).user?.id || req.body.partnerId;
    const status = req.body.status || "ONLINE";
    const availability = req.body.availability || "AVAILABLE";

    if (!partnerId) {
      return res.status(400).json({ error: "Partner ID is required" });
    }

    if (status === "OFFLINE") {
      await PartnerLocationService.setPartnerOffline(partnerId);
    }

    return res.status(200).json({
      success: true,
      partnerId,
      status,
      availability,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update partner status", details: err.message });
  }
});

router.get("/partners/:partnerId/location", async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.params;
    const state = await PartnerLocationService.getPartnerState(partnerId);

    if (state) {
      return res.status(200).json({
        success: true,
        source: "redis",
        partnerId,
        lat: state.lat,
        lng: state.lng,
        speed: state.speed,
        heading: state.heading,
        status: state.status,
        timestamp: state.timestamp,
      });
    }

    // Fallback to Firestore
    const partner = await firestoreDb.partners.findFirst({ where: { userId: partnerId } });
    if (partner && partner.latitude != null && partner.longitude != null) {
      return res.status(200).json({
        success: true,
        source: "firestore",
        partnerId,
        lat: partner.latitude,
        lng: partner.longitude,
        status: partner.availability ? "ONLINE" : "OFFLINE",
        timestamp: partner.lastLocationAt || null,
      });
    }

    return res.status(404).json({ error: "Partner location not found" });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to query partner location", details: err.message });
  }
});

export default router;
