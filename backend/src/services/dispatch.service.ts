import { dbClient } from './db.service';
import {
  acquireLock,
  nearbyOnlinePartners,
  scheduleDispatchTimeout,
  claimDueDispatchTimeouts,
} from './redis.service';
import { notifyDispatch } from './websocket.service';
import { ensurePartnerEarningSnapshot } from './partner-earnings.service';

const OFFER_TIMEOUT_MS = Number(process.env.DISPATCH_OFFER_TIMEOUT_MS || 15000);
const MAX_ROUNDS = Number(process.env.DISPATCH_MAX_ROUNDS || 5);
const RADIUS_KM = Number(process.env.DISPATCH_RADIUS_KM || 5);
const BATCH_SIZE = Number(process.env.DISPATCH_BATCH_SIZE || 1);

export interface DispatchResult {
  bookingId: string;
  round: number;
  partnerIds: string[];
  expiresAt: string;
}

function parseDeclined(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function dispatchBooking(bookingId: string, lat: number, lng: number): Promise<DispatchResult> {
  await ensurePartnerEarningSnapshot(bookingId);
  const booking = await dbClient.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');
  if (!['PAID', 'DISPATCHED'].includes(booking.status)) {
    throw new Error(`Booking cannot be dispatched from ${booking.status}`);
  }

  const activeDispatches = await dbClient.workDispatch.findMany({
    where: { bookingId, status: 'PENDING', expiresAt: { gt: new Date() } },
    orderBy: { round: 'desc' },
  });
  if (booking.status === 'DISPATCHED' && activeDispatches.length) {
    const round = activeDispatches[0].round;
    const partnerIds = activeDispatches.map((item) => item.partnerId);
    const expiryDates = activeDispatches
      .map((item) => item.expiresAt)
      .filter((value): value is Date => value instanceof Date);
    const expiresAt = (expiryDates.sort((a, b) => a.getTime() - b.getTime())[0] || new Date()).toISOString();
    return { bookingId, round, partnerIds, expiresAt };
  }

  const declined = parseDeclined(booking.declinedBy);
  const candidates = await nearbyOnlinePartners(lat, lng, RADIUS_KM, 100);
  const profiles = await dbClient.partner.findMany({
    where: {
      id: { in: candidates },
      availability: true,
      isVerified: true,
      deletedAt: null,
    },
    select: { id: true },
  });
  const eligibleSet = new Set(profiles.map((profile) => profile.id));
  const eligible = candidates.filter((id) => eligibleSet.has(id) && !declined.includes(id)).slice(0, BATCH_SIZE);
  if (!eligible.length) throw new Error('No eligible online partners available');

  const round = Number(booking.dispatchRound || 0) + 1;
  if (round > MAX_ROUNDS) throw new Error('Dispatch retry limit reached');

  const expiresAtDate = new Date(Date.now() + OFFER_TIMEOUT_MS);

  const updatedBooking = await dbClient.$transaction(async (tx) => {
    const current = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!current || !['PAID', 'DISPATCHED'].includes(current.status)) {
      throw new Error(`Booking changed before dispatch: ${current?.status || 'missing'}`);
    }

    const next = await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'DISPATCHED', dispatchRound: round },
    });

    await Promise.all(
      eligible.map((partnerId) => tx.workDispatch.create({
        data: {
          bookingId,
          partnerId,
          status: 'PENDING',
          round,
          expiresAt: expiresAtDate,
        },
      }))
    );

    return next;
  });

  await scheduleDispatchTimeout(bookingId, round, expiresAtDate.getTime());

  notifyDispatch({ bookingId, partnerIds: eligible, booking: updatedBooking, round });

  return {
    bookingId,
    round,
    partnerIds: eligible,
    expiresAt: expiresAtDate.toISOString(),
  };
}

async function expireRound(bookingId: string, round: number): Promise<void> {
  const active = await dbClient.booking.findUnique({ where: { id: bookingId } });
  if (!active || active.status !== 'DISPATCHED' || active.partnerId) return;

  const pending = await dbClient.workDispatch.findMany({
    where: { bookingId, round, status: 'PENDING' },
    select: { partnerId: true },
  });
  if (!pending.length) return;

  await dbClient.$transaction(async (tx) => {
    await tx.workDispatch.updateMany({
      where: { bookingId, round, status: 'PENDING' },
      data: { status: 'EXPIRED', respondedAt: new Date() },
    });

    const current = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!current || current.partnerId || current.status !== 'DISPATCHED') return;

    const declined = parseDeclined(current.declinedBy);
    const merged = Array.from(new Set([...declined, ...pending.map((item) => item.partnerId)]));
    await tx.booking.update({
      where: { id: bookingId },
      data: { declinedBy: JSON.stringify(merged) },
    });
  });

  const current = await dbClient.booking.findUnique({ where: { id: bookingId } });
  if (!current || current.partnerId || !['PAID', 'DISPATCHED'].includes(current.status)) return;

  const currentLat = Number(current.latitude);
  const currentLng = Number(current.longitude);
  if (Number.isFinite(currentLat) && Number.isFinite(currentLng)) {
    try {
      await dispatchBooking(bookingId, currentLat, currentLng);
    } catch (error) {
      console.warn('[Dispatch] retry stopped:', (error as Error).message);
    }
  }
}

let workerStarted = false;

export function startDispatchTimeoutWorker(): void {
  if (workerStarted) return;
  workerStarted = true;

  const tick = async () => {
    const owner = `${process.pid}:${Date.now()}`;
    const locked = await acquireLock('orbit:dispatch:worker', owner, 2500);
    if (!locked) return;

    const entries = await claimDueDispatchTimeouts(25);
    for (const entry of entries) {
      const separator = entry.lastIndexOf(':');
      if (separator < 1) continue;
      const bookingId = entry.slice(0, separator);
      const round = Number(entry.slice(separator + 1));
      if (!Number.isInteger(round)) continue;
      await expireRound(bookingId, round).catch((error) => {
        console.warn('[DispatchWorker] expiry processing failed:', (error as Error).message);
      });
    }
  };

  void tick();
  const interval = setInterval(() => void tick(), 2000);
  interval.unref?.();
}
