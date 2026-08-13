import { Request, Response, NextFunction } from 'express';
import { dbClient } from '../services/db.service';
import { canTransition, isBookingState, BookingState } from '../core/booking-state';

/**
 * Protects the generic booking PATCH route from bypassing the authoritative
 * booking workflow. Partner assignment and payment confirmation have their
 * own dedicated, audited paths and cannot be injected through PATCH.
 */
export async function bookingPatchPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bookingId = String(req.params.id || '');
    if (!bookingId) {
      res.status(400).json({ error: 'Booking id is required' });
      return;
    }

    const body = (req.body || {}) as Record<string, unknown>;

    if (body.partnerId !== undefined && body.partnerId !== null) {
      res.status(403).json({ error: 'Partner assignment is only permitted through the partner acceptance flow' });
      return;
    }

    if (body.paymentStatus !== undefined) {
      res.status(403).json({ error: 'Payment state is managed only by the payment order/webhook workflow' });
      return;
    }

    if (body.status === undefined || body.status === null || body.status === '') {
      next();
      return;
    }

    const booking = await dbClient.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const from = booking.status as BookingState;
    const to = String(body.status);

    if (!isBookingState(from) || !isBookingState(to)) {
      res.status(400).json({ error: `Invalid booking state: ${to}` });
      return;
    }

    // A partner cancellation is intentionally handled by the existing
    // re-dispatch workflow. It begins as a CANCELLED request but may internally
    // recover the booking back into dispatch after cleanup.
    const partnerCancellation = to === 'CANCELLED' && body.cancelledBy === 'PARTNER';
    if (!partnerCancellation && from !== to && !canTransition(from, to)) {
      res.status(409).json({ error: `Invalid booking transition: ${from} -> ${to}` });
      return;
    }

    next();
  } catch (error) {
    console.error('[BookingPolicy] validation failed:', error);
    res.status(500).json({ error: 'Failed to validate booking transition' });
  }
}
