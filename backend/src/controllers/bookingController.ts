import { Request, Response } from 'express';
import { BookingModel, BookingStatus } from '../models/BookingModel';

export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookingData = req.body;
    if (!bookingData.pickupLat || !bookingData.pickupLng) {
      res.status(400).json({ error: 'Pickup location coordinates required' });
      return;
    }

    const newBooking = await BookingModel.create({
      ...bookingData,
      status: 'PENDING_PARTNER_ACCEPTANCE',
    });

    res.status(201).json(newBooking);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create booking' });
  }
};

export const acceptBooking = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { partnerId } = req.body;

  try {
    const booking = await BookingModel.findById(id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const updated = await BookingModel.updateStatus(id, 'PARTNER_ACCEPTED', partnerId);
    res.status(200).json({
      message: 'Booking accepted by partner',
      booking: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to accept booking' });
  }
};

export const rejectBooking = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const updated = await BookingModel.updateStatus(id, 'REJECTED');
    res.status(200).json({
      message: 'Booking rejected',
      booking: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reject booking' });
  }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, partnerId } = req.body;

  try {
    const updated = await BookingModel.updateStatus(id, status as BookingStatus, partnerId);
    if (!updated) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.status(200).json({
      message: `Status updated to ${status}`,
      booking: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update booking status' });
  }
};

export const getBookings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const bookings = await BookingModel.findAll();
    res.status(200).json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch bookings' });
  }
};
