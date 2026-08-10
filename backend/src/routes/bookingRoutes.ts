import { Router } from 'express';
import {
  createBooking,
  acceptBooking,
  rejectBooking,
  updateStatus,
  getBookings,
} from '../controllers/bookingController';

const router = Router();

router.post('/', createBooking);
router.get('/', getBookings);
router.post('/:id/accept', acceptBooking);
router.post('/:id/reject', rejectBooking);
router.patch('/:id/status', updateStatus);

export default router;
