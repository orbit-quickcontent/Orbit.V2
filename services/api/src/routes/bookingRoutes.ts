import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import {
  createBookingHandler,
  acceptBookingHandler,
  rejectBookingHandler,
  getBookingByIdHandler,
  updateBookingStatusHandler,
  createBookingSchema,
  bookingStatusUpdateSchema,
} from '../controllers/bookingController';

const router = Router();

router.post('/bookings', validateBody(createBookingSchema), createBookingHandler);
router.post('/bookings/:id/accept', authenticateJwt, acceptBookingHandler);
router.post('/bookings/:id/reject', authenticateJwt, rejectBookingHandler);
router.get('/bookings/:id', getBookingByIdHandler);
router.patch('/bookings/:id/status', authenticateJwt, validateBody(bookingStatusUpdateSchema), updateBookingStatusHandler);

export default router;
