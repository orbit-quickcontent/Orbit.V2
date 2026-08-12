import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { authenticateJwt, AuthenticatedRequest } from '../auth';
import { initiateBookingDispatch, activeBookingsMap } from '../dispatch';
import { FirestoreBooking, BookingStatus } from '../types';
import { broadcastToBooking, broadcastToRole } from '../socket';

const router = Router();

// Input Validation Schemas
const CreateBookingSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().optional(),
  price: z.number().positive().default(499),
  editorId: z.string().nullable().optional()
});

const UpdateStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  cancellationReason: z.string().optional(),
  reelUrl: z.string().url().optional(),
  rawFootageUrls: z.array(z.string().url()).optional()
});

// POST /api/bookings - Create new reel shoot booking & initiate partner dispatch
router.post('/', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = CreateBookingSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking parameters',
        errors: parseResult.error.errors
      });
    }

    const { lat, lng, address, price, editorId = null } = parseResult.data;
    const user = req.user!;

    const platformFee = Math.round(price * 0.2); // 20% platform commission
    const partnerEarning = Math.round(price * 0.6); // 60% partner earning
    const editorEarning = Math.round(price * 0.2); // 20% editor earning

    const newBooking: FirestoreBooking = {
      bookingId: `orb_${uuidv4().replace(/-/g, '').substring(0, 12)}`,
      clientId: user.id,
      clientName: user.name || 'Client',
      partnerId: null,
      partnerName: null,
      editorId: editorId || null,
      status: BookingStatus.PENDING,
      clientLocation: {
        latitude: lat,
        longitude: lng,
        address: address || 'Current Location',
        timestamp: Date.now()
      },
      partnerLocation: null,
      createdAt: new Date().toISOString(),
      assignedAt: null,
      acceptedAt: null,
      arrivedAt: null,
      shootingStartedAt: null,
      rawFootageUrls: [],
      reelUrl: null,
      deliveredAt: null,
      cancelledAt: null,
      cancellationReason: null,
      price,
      platformFee,
      partnerEarning,
      editorEarning,
      offeredPartnerIds: []
    };

    // Store in active bookings map
    activeBookingsMap.set(newBooking.bookingId, newBooking);

    // Trigger dispatch pipeline asynchronously or synchronously based on query flag
    const syncMode = req.query.sync === 'true';

    if (syncMode) {
      const dispatchResult = await initiateBookingDispatch(newBooking);
      return res.status(201).json({
        success: true,
        message: dispatchResult.assigned ? 'Partner successfully assigned' : 'Dispatch attempt completed',
        dispatchResult,
        booking: newBooking
      });
    } else {
      // Background dispatch launch
      setImmediate(async () => {
        await initiateBookingDispatch(newBooking);
      });

      return res.status(201).json({
        success: true,
        message: 'Booking created. Partner search initiated in background.',
        bookingId: newBooking.bookingId,
        status: newBooking.status,
        booking: newBooking
      });
    }
  } catch (err: any) {
    console.error('[Bookings API Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to create booking', error: err.message });
  }
});

// GET /api/bookings/:id - Fetch booking details
router.get('/:id', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const booking = activeBookingsMap.get(id);

  if (!booking) {
    return res.status(404).json({ success: false, message: `Booking with ID ${id} not found` });
  }

  return res.json({
    success: true,
    booking
  });
});

// POST /api/bookings/:id/cancel - Cancel active booking
router.post('/:id/cancel', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason = 'Cancelled by user' } = req.body;

  const booking = activeBookingsMap.get(id);
  if (!booking) {
    return res.status(404).json({ success: false, message: `Booking with ID ${id} not found` });
  }

  booking.status = BookingStatus.CANCELLED;
  booking.cancelledAt = new Date().toISOString();
  booking.cancellationReason = reason;
  activeBookingsMap.set(id, booking);

  // Broadcast cancellation to booking room, assigned partner, and admin
  broadcastToBooking(id, 'booking_cancelled', {
    bookingId: id,
    status: BookingStatus.CANCELLED,
    cancellationReason: reason,
    cancelledAt: booking.cancelledAt
  });
  broadcastToRole('admin', 'booking_status_changed', {
    bookingId: id,
    status: BookingStatus.CANCELLED
  });

  return res.json({
    success: true,
    message: 'Booking successfully cancelled',
    booking
  });
});

// PATCH /api/bookings/:id/status - Update booking status lifecycle (EN_ROUTE, ARRIVED, SHOOTING, UPLOADING, EDITING, DELIVERED)
router.patch('/:id/status', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const parseResult = UpdateStatusSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ success: false, message: 'Invalid payload', errors: parseResult.error.errors });
  }

  const booking = activeBookingsMap.get(id);
  if (!booking) {
    return res.status(404).json({ success: false, message: `Booking with ID ${id} not found` });
  }

  const { status, cancellationReason, reelUrl, rawFootageUrls } = parseResult.data;

  booking.status = status;
  const now = new Date().toISOString();

  if (status === BookingStatus.ARRIVED) booking.arrivedAt = now;
  if (status === BookingStatus.SHOOTING) booking.shootingStartedAt = now;
  if (status === BookingStatus.DELIVERED) booking.deliveredAt = now;
  if (status === BookingStatus.CANCELLED) {
    booking.cancelledAt = now;
    booking.cancellationReason = cancellationReason || 'Cancelled';
  }
  if (reelUrl) booking.reelUrl = reelUrl;
  if (rawFootageUrls) booking.rawFootageUrls = rawFootageUrls;

  activeBookingsMap.set(id, booking);

  // Broadcast real-time status update to client, partner, editor, and admin
  broadcastToBooking(id, 'booking_status_changed', {
    bookingId: id,
    status,
    updatedAt: now,
    booking
  });
  broadcastToRole('editor', 'booking_status_changed', { bookingId: id, status, editorId: booking.editorId });
  broadcastToRole('admin', 'booking_status_changed', { bookingId: id, status });

  return res.json({
    success: true,
    message: `Booking status updated to ${status}`,
    booking
  });
});

export default router;
