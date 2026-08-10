import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { locationRateLimiter } from '../middleware/rateLimiter';
import {
  updatePartnerLocationHandler,
  getNearbyPartnersHandler,
  locationBodySchema,
  nearbyQuerySchema,
} from '../controllers/partnerController';

const router = Router();

// REST endpoint for continuous background location updates: POST /api/partner/location
router.post(
  '/partner/location',
  locationRateLimiter,
  authenticateJwt,
  validateBody(locationBodySchema),
  updatePartnerLocationHandler
);

// Nearby partner search endpoint: GET /api/partners/nearby?lat=...&lng=...&radius=...
router.get(
  '/partners/nearby',
  validateQuery(nearbyQuerySchema),
  getNearbyPartnersHandler
);

export default router;
