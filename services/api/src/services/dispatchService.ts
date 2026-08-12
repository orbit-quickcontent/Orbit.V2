import { PrismaClient, BookingStatus, PartnerStatus } from '@prisma/client';
import { findNearbyPartnersSortedByEta } from './partnerService';
import { sendBookingOfferToPartner, notifyBookingStatusChanged } from './socketService';
import { redis, addPartnerToGeoSet } from '../config/redis';
import { calculateHaversineDistance, calculateEtaMinutes } from '../utils/geo';

const prisma = new PrismaClient();
const DISPATCH_TIMEOUT_MS = 15000; // 15 seconds as per requirements

interface DispatchSession {
  bookingId: string;
  candidateIds: string[];
  currentPartnerId?: string;
  timerHandle?: NodeJS.Timeout;
}

const activeDispatches = new Map<string, DispatchSession>();

export async function initiateBookingDispatch(bookingId: string): Promise<boolean> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');

  // 1. Find nearest ONLINE partners within 10 km
  const nearbyPartners = await findNearbyPartnersSortedByEta(
    booking.pickupLat,
    booking.pickupLng,
    10
  );

  if (nearbyPartners.length === 0) {
    console.warn(`[DISPATCH] No online partners found for booking ${bookingId}`);
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });
    notifyBookingStatusChanged(bookingId, BookingStatus.CANCELLED, null, 'No nearby partners available');
    return false;
  }

  const candidateIds = nearbyPartners.map((p) => p.partnerId);

  const session: DispatchSession = {
    bookingId,
    candidateIds,
  };

  activeDispatches.set(bookingId, session);
  await dispatchToNextCandidate(bookingId);
  return true;
}

async function dispatchToNextCandidate(bookingId: string): Promise<void> {
  const session = activeDispatches.get(bookingId);
  if (!session) return;

  if (session.timerHandle) {
    clearTimeout(session.timerHandle);
    session.timerHandle = undefined;
  }

  if (session.candidateIds.length === 0) {
    console.log(`[DISPATCH] All candidate partners exhausted for booking ${bookingId}`);
    activeDispatches.delete(bookingId);

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    notifyBookingStatusChanged(
      bookingId,
      BookingStatus.CANCELLED,
      null,
      'All nearby partners declined or timed out'
    );
    return;
  }

  const candidateId = session.candidateIds.shift()!;
  session.currentPartnerId = candidateId;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.status !== BookingStatus.PENDING) {
    activeDispatches.delete(bookingId);
    return;
  }

  const partner = await prisma.partner.findUnique({ where: { id: candidateId } });
  if (!partner || partner.status !== PartnerStatus.ONLINE) {
    // Skip partner if no longer ONLINE
    await dispatchToNextCandidate(bookingId);
    return;
  }

  const dist = calculateHaversineDistance(
    booking.pickupLat,
    booking.pickupLng,
    partner.latitude,
    partner.longitude
  );
  const eta = calculateEtaMinutes(dist);

  console.log(`[DISPATCH] Offering booking ${bookingId} to partner ${candidateId} (ETA: ${eta} mins)`);

  // Send offer payload to partner socket room
  sendBookingOfferToPartner(candidateId, {
    bookingId: booking.id,
    clientId: booking.clientId,
    pickupLat: booking.pickupLat,
    pickupLng: booking.pickupLng,
    destinationLat: booking.destinationLat,
    destinationLng: booking.destinationLng,
    distanceKm: dist,
    etaMinutes: eta,
    expiresInSeconds: 15,
  });

  // Set 15-second sequential timeout
  session.timerHandle = setTimeout(async () => {
    console.log(`[DISPATCH] Partner ${candidateId} timed out for booking ${bookingId}`);
    await dispatchToNextCandidate(bookingId);
  }, DISPATCH_TIMEOUT_MS);
}

export async function handlePartnerAccept(
  bookingId: string,
  partnerId: string
): Promise<{ success: boolean; booking?: any }> {
  const session = activeDispatches.get(bookingId);

  // Clear timeout if active
  if (session?.timerHandle) {
    clearTimeout(session.timerHandle);
  }
  activeDispatches.delete(bookingId);

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return { success: false };
  }

  if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.ASSIGNED) {
    return { success: false };
  }

  // Update DB Booking status -> ACCEPTED (or ASSIGNED)
  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: BookingStatus.ACCEPTED,
      partnerId: partnerId,
    },
  });

  // Update DB Partner status -> BUSY
  await prisma.partner.update({
    where: { id: partnerId },
    data: { status: PartnerStatus.BUSY },
  });

  // Re-index partner location in Redis
  const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
  if (partner) {
    await addPartnerToGeoSet(partner.id, partner.latitude, partner.longitude);
  }

  // Notify client and connected subscribers
  notifyBookingStatusChanged(
    bookingId,
    BookingStatus.ACCEPTED,
    partnerId,
    'Partner accepted booking'
  );

  return { success: true, booking: updatedBooking };
}

export async function handlePartnerReject(
  bookingId: string,
  partnerId: string
): Promise<void> {
  const session = activeDispatches.get(bookingId);
  if (session && session.currentPartnerId === partnerId) {
    console.log(`[DISPATCH] Partner ${partnerId} explicitly rejected booking ${bookingId}`);
    if (session.timerHandle) {
      clearTimeout(session.timerHandle);
    }
    await dispatchToNextCandidate(bookingId);
  }
}
