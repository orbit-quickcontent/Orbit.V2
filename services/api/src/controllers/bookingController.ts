import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient, BookingStatus, PartnerStatus } from '@prisma/client';
import { initiateBookingDispatch, handlePartnerAccept, handlePartnerReject } from '../services/dispatchService';
import { notifyBookingStatusChanged } from '../services/socketService';
import { z } from 'zod';

const prisma = new PrismaClient();

export const createBookingSchema = z.object({
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  destinationLat: z.number().min(-90).max(90),
  destinationLng: z.number().min(-180).max(180),
});

export const bookingStatusUpdateSchema = z.object({
  status: z.enum([
    'PENDING',
    'ASSIGNED',
    'ACCEPTED',
    'EN_ROUTE',
    'SHOOTING',
    'EDITING',
    'DELIVERED',
    'CANCELLED',
  ]),
});

export async function createBookingHandler(req: AuthRequest, res: Response): Promise<void> {
  const clientId = req.user?.id || 'client-guest-1';

  try {
    const { pickupLat, pickupLng, destinationLat, destinationLng } = req.body;

    const booking = await prisma.booking.create({
      data: {
        clientId,
        pickupLat,
        pickupLng,
        destinationLat,
        destinationLng,
        status: BookingStatus.PENDING,
      },
    });

    // Trigger async matching & dispatch service
    initiateBookingDispatch(booking.id).catch((err) => {
      console.error(`[DISPATCH_INIT_ERR] Booking ${booking.id}:`, err);
    });

    res.status(201).json({
      success: true,
      message: 'Booking created, partner dispatch initiated',
      booking,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create booking' });
  }
}

export async function acceptBookingHandler(req: AuthRequest, res: Response): Promise<void> {
  const { id: bookingId } = req.params;
  const partnerId = req.user?.partnerId || req.user?.id;

  if (!partnerId) {
    res.status(400).json({ error: 'Partner ID context required' });
    return;
  }

  try {
    const result = await handlePartnerAccept(bookingId, partnerId);
    if (!result.success) {
      res.status(400).json({ error: 'Booking no longer available or already accepted' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Booking accepted successfully',
      booking: result.booking,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to accept booking' });
  }
}

export async function rejectBookingHandler(req: AuthRequest, res: Response): Promise<void> {
  const { id: bookingId } = req.params;
  const partnerId = req.user?.partnerId || req.user?.id;

  if (!partnerId) {
    res.status(400).json({ error: 'Partner ID context required' });
    return;
  }

  try {
    await handlePartnerReject(bookingId, partnerId);
    res.status(200).json({
      success: true,
      message: 'Booking rejected',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reject booking' });
  }
}

export async function getBookingByIdHandler(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { partner: true },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    res.status(200).json(booking);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch booking' });
  }
}

export async function updateBookingStatusHandler(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body;
  const partnerId = req.user?.partnerId || req.user?.id;

  try {
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: status as BookingStatus },
    });

    if (status === BookingStatus.DELIVERED || status === BookingStatus.CANCELLED) {
      if (partnerId) {
        await prisma.partner.update({
          where: { id: partnerId },
          data: { status: PartnerStatus.ONLINE },
        });
      }
    } else if (status === BookingStatus.EN_ROUTE || status === BookingStatus.SHOOTING) {
      if (partnerId) {
        await prisma.partner.update({
          where: { id: partnerId },
          data: { status: PartnerStatus.ON_TRIP },
        });
      }
    }

    notifyBookingStatusChanged(id, status, partnerId, `Status updated to ${status}`);

    res.status(200).json({
      success: true,
      booking: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update booking status' });
  }
}
