import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { processPartnerLocationUpdate, findNearbyPartnersSortedByEta } from '../services/partnerService';
import { z } from 'zod';

export const locationBodySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().optional().default(0),
  heading: z.number().optional().default(0),
});

export const nearbyQuerySchema = z.object({
  lat: z.string().transform((v) => parseFloat(v)),
  lng: z.string().transform((v) => parseFloat(v)),
  radius: z.string().optional().transform((v) => (v ? parseFloat(v) : 5)),
});

export async function updatePartnerLocationHandler(req: AuthRequest, res: Response): Promise<void> {
  const partnerId = req.user?.partnerId || req.user?.id;

  if (!partnerId) {
    res.status(400).json({ error: 'Partner ID not found in token context' });
    return;
  }

  try {
    const { latitude, longitude, speed, heading } = req.body;
    const result = await processPartnerLocationUpdate(partnerId, {
      latitude,
      longitude,
      speed,
      heading,
    });

    if (result.spoofed) {
      res.status(422).json({
        error: 'GPS location rejected: Sudden distance jump detected',
        spoofed: true,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      partner: result.partner,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update partner location' });
  }
}

export async function getNearbyPartnersHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { lat, lng, radius } = req.query as unknown as { lat: number; lng: number; radius: number };

    const nearbyPartners = await findNearbyPartnersSortedByEta(lat, lng, radius);
    res.status(200).json(nearbyPartners);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to search nearby partners' });
  }
}
