import { Router, Request, Response } from "express";
import { triggerNearbyPartnerDispatch, acceptPartnerOffer, declinePartnerOffer, releasePartnerLock } from "../services/dispatch.service";
import { firestoreDb } from "../lib/db";

const router = Router();

router.post("/dispatch/:bookingId", async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const booking = await firestoreDb.bookings.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    await triggerNearbyPartnerDispatch(bookingId);

    return res.status(200).json({
      success: true,
      message: "Dispatch initiated successfully",
      bookingId,
      round: booking.dispatchRound || 1,
    });
  } catch (err: any) {
    console.error("[DispatchRouter Error]", err.message);
    return res.status(500).json({ error: "Failed to initiate dispatch", details: err.message });
  }
});

router.get("/dispatch/:bookingId", async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const booking = await firestoreDb.bookings.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const dispatches = await firestoreDb.workDispatches.findMany({
      where: { bookingId },
    });

    return res.status(200).json({
      success: true,
      bookingId,
      status: booking.status,
      partnerId: booking.partnerId || null,
      round: booking.dispatchRound || 1,
      dispatches,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to retrieve dispatch status", details: err.message });
  }
});

router.post("/dispatch/:bookingId/cancel", async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    await releasePartnerLock(bookingId);

    return res.status(200).json({
      success: true,
      message: "Dispatch cancelled and locks released",
      bookingId,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to cancel dispatch", details: err.message });
  }
});

router.post("/dispatch/:bookingId/accept", async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const partnerId = (req as any).user?.id || req.body.partnerId;
    const partnerName = req.body.partnerName || "Partner";

    if (!partnerId) {
      return res.status(400).json({ error: "Missing partnerId" });
    }

    const result = await acceptPartnerOffer(bookingId, partnerId, partnerName);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to accept offer", details: err.message });
  }
});

router.post("/dispatch/:bookingId/decline", async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const partnerId = (req as any).user?.id || req.body.partnerId;

    if (!partnerId) {
      return res.status(400).json({ error: "Missing partnerId" });
    }

    const result = await declinePartnerOffer(bookingId, partnerId);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to decline offer", details: err.message });
  }
});

export default router;
