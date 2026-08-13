import { firestoreDb } from '../lib/db';
import { nearbyOnlinePartners } from './redis.service';
import { notifyDispatch } from './websocket.service';

const OFFER_TIMEOUT_MS = Number(process.env.DISPATCH_OFFER_TIMEOUT_MS || 15000);
const MAX_ROUNDS = Number(process.env.DISPATCH_MAX_ROUNDS || 5);
const RADIUS_KM = Number(process.env.DISPATCH_RADIUS_KM || 10);
const BATCH_SIZE = Number(process.env.DISPATCH_BATCH_SIZE || 3);

export interface DispatchResult {
  bookingId: string;
  round: number;
  partnerIds: string[];
  expiresAt: string;
}

export async function dispatchBooking(bookingId: string, lat: number, lng: number): Promise<DispatchResult> {
  const booking = await firestoreDb.bookings.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');
  if (!['PAID', 'DISPATCHED'].includes(booking.status)) {
    throw new Error(`Booking cannot be dispatched from ${booking.status}`);
  }

  const declined = booking.declinedBy ? JSON.parse(booking.declinedBy) as string[] : [];
  const candidates = await nearbyOnlinePartners(lat, lng, RADIUS_KM, 100);
  const eligible = candidates.filter((id) => !declined.includes(id)).slice(0, BATCH_SIZE);
  if (!eligible.length) throw new Error('No eligible online partners available');

  const round = Number(booking.dispatchRound || 0) + 1;
  if (round > MAX_ROUNDS) throw new Error('Dispatch retry limit reached');

  await firestoreDb.bookings.update({
    where: { id: bookingId },
    data: { status: 'DISPATCHED', dispatchRound: round },
  });

  for (const partnerId of eligible) {
    await firestoreDb.workDispatches.create({
      data: {
        bookingId,
        partnerId,
        status: 'PENDING',
        round,
        dispatchedAt: new Date().toISOString(),
      },
    });
  }

  const expiresAt = new Date(Date.now() + OFFER_TIMEOUT_MS).toISOString();
  notifyDispatch({ bookingId, partnerIds: eligible, booking, round });

  setTimeout(() => {
    void expireRound(bookingId, round, eligible);
  }, OFFER_TIMEOUT_MS).unref?.();

  return { bookingId, round, partnerIds: eligible, expiresAt };
}

async function expireRound(bookingId: string, round: number, partnerIds: string[]): Promise<void> {
  const active = await firestoreDb.bookings.findUnique({ where: { id: bookingId } });
  if (!active || active.status !== 'DISPATCHED' || active.partnerId) return;

  await firestoreDb.workDispatches.updateMany({
    where: { bookingId, round, status: 'PENDING' },
    data: { status: 'EXPIRED', respondedAt: new Date().toISOString() },
  });

  const current = await firestoreDb.bookings.findUnique({ where: { id: bookingId } });
  if (!current || current.partnerId) return;
  const declined = current.declinedBy ? JSON.parse(current.declinedBy) as string[] : [];
  const merged = Array.from(new Set([...declined, ...partnerIds]));
  await firestoreDb.bookings.update({
    where: { id: bookingId },
    data: { declinedBy: JSON.stringify(merged) },
  });

  const lat = Number((current as any).latitude);
  const lng = Number((current as any).longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    try {
      await dispatchBooking(bookingId, lat, lng);
    } catch (error) {
      console.warn('[Dispatch] retry stopped:', (error as Error).message);
    }
  }
}
