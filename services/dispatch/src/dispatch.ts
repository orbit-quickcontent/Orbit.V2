import { io, onlinePartnerSockets, sendToUser, broadcastToBooking, broadcastToRole } from './socket';
import {
  searchNearbyPartnersGeo,
  isPartnerOfferedForBooking,
  markPartnerOfferedForBooking,
  getPartnerPresence,
  getPartnerResponseScore,
  recordPartnerResponseMetric
} from './redis';
import {
  FirestoreBooking,
  BookingStatus,
  DispatchSearchResult,
  NewBookingOfferPayload,
  BookingResponsePayload
} from './types';

// In-Memory Store for active bookings (Firestore-ready state)
export const activeBookingsMap = new Map<string, FirestoreBooking>();

// Radius search steps in Kilometers
const SEARCH_RADII_KM = [3, 5, 8, 12];
const OFFER_TIMEOUT_MS = 15000; // 15 seconds per partner offer

interface PartnerCandidate {
  partnerId: string;
  socketId: string;
  distanceKm: number;
  score: number;
}

/**
 * Calculates candidate ranking score. Lower score = higher priority.
 * Formula: score = (distance_km * 0.7) + (active_bookings * 0.2) + ((1 - response_rate) * 0.1)
 */
async function calculateCandidateScore(
  partnerId: string,
  socketId: string,
  distanceKm: number
): Promise<PartnerCandidate> {
  const presence = await getPartnerPresence(partnerId);
  const activeBookings = presence?.activeBookingsCount || 0;
  const responseRate = await getPartnerResponseScore(partnerId);

  // High response rate = low penalty score
  const responseTimeScore = 1 - responseRate;

  const score = (distanceKm * 0.7) + (activeBookings * 0.2) + (responseTimeScore * 0.1);

  return {
    partnerId,
    socketId,
    distanceKm,
    score
  };
}

export async function initiateBookingDispatch(booking: FirestoreBooking): Promise<DispatchSearchResult> {
  booking.status = BookingStatus.SEARCHING;
  activeBookingsMap.set(booking.bookingId, booking);

  // Broadcast SEARCHING status to Client & Admin
  broadcastToBooking(booking.bookingId, 'booking_searching', {
    bookingId: booking.bookingId,
    status: BookingStatus.SEARCHING,
    clientLocation: booking.clientLocation,
    createdAt: booking.createdAt
  });
  broadcastToRole('admin', 'booking_status_changed', {
    bookingId: booking.bookingId,
    status: BookingStatus.SEARCHING
  });

  const clientLat = booking.clientLocation.latitude;
  const clientLng = booking.clientLocation.longitude;

  let totalAttempts = 0;

  for (const radiusKm of SEARCH_RADII_KM) {
    console.log(`[Dispatch] Searching within ${radiusKm} km for booking ${booking.bookingId}...`);

    // Fetch nearby online partners via Redis GEO
    const nearbyGeo = await searchNearbyPartnersGeo(clientLat, clientLng, radiusKm);
    if (nearbyGeo.length === 0) continue;

    // Filter candidate list
    const candidatePromises: Array<Promise<PartnerCandidate | null>> = nearbyGeo.map(async (item) => {
      const socketId = onlinePartnerSockets.get(item.partnerId);
      if (!socketId) return null; // Offline or on another socket server node without sticky session

      // Check if already offered
      const alreadyOffered = await isPartnerOfferedForBooking(booking.bookingId, item.partnerId);
      if (alreadyOffered) return null;

      // Check presence
      const presence = await getPartnerPresence(item.partnerId);
      if (!presence || !presence.isOnline) return null;

      // Score partner candidate
      return calculateCandidateScore(item.partnerId, socketId, item.distanceKm);
    });

    const evaluatedCandidates = await Promise.all(candidatePromises);
    const validCandidates = evaluatedCandidates.filter((c): c is PartnerCandidate => c !== null);

    // Sort by rank score ASC (lowest score first)
    validCandidates.sort((a, b) => a.score - b.score);

    // Try candidates sequentially in ranked order
    for (const candidate of validCandidates) {
      totalAttempts++;
      console.log(`[Dispatch Offer] Offering booking ${booking.bookingId} to Partner ${candidate.partnerId} (Dist: ${candidate.distanceKm.toFixed(2)} km, Score: ${candidate.score.toFixed(3)})`);

      // Mark partner as offered in Redis Set
      await markPartnerOfferedForBooking(booking.bookingId, candidate.partnerId);
      if (!booking.offeredPartnerIds) booking.offeredPartnerIds = [];
      booking.offeredPartnerIds.push(candidate.partnerId);

      booking.status = BookingStatus.OFFERED;
      activeBookingsMap.set(booking.bookingId, booking);

      // Construct offer payload
      const offerPayload: NewBookingOfferPayload = {
        bookingId: booking.bookingId,
        clientLat,
        clientLng,
        clientAddress: booking.clientLocation.address || 'Client GPS Location',
        distanceKm: Math.round(candidate.distanceKm * 100) / 100,
        price: booking.price,
        timeoutSeconds: 15,
        createdAt: new Date().toISOString()
      };

      // Emit new_booking_request to target partner socket
      io.to(candidate.socketId).emit('new_booking_request', offerPayload);

      // Wait 15s for partner accept/reject response
      const accepted = await waitForPartnerResponse(booking.bookingId, candidate.partnerId);

      if (accepted) {
        // Partner ACCEPTED booking
        console.log(`[Dispatch SUCCESS] Partner ${candidate.partnerId} accepted booking ${booking.bookingId}`);

        booking.status = BookingStatus.ACCEPTED;
        booking.partnerId = candidate.partnerId;
        booking.assignedAt = new Date().toISOString();
        booking.acceptedAt = new Date().toISOString();
        activeBookingsMap.set(booking.bookingId, booking);

        // Notify client app
        sendToUser(booking.clientId, 'booking_assigned', {
          bookingId: booking.bookingId,
          status: BookingStatus.ACCEPTED,
          partnerId: candidate.partnerId,
          assignedAt: booking.assignedAt
        });

        // Notify accepted partner app
        sendToUser(candidate.partnerId, 'booking_offer_confirmed', {
          bookingId: booking.bookingId,
          status: BookingStatus.ACCEPTED,
          clientLocation: booking.clientLocation
        });

        // Broadcast to Editor room & Admin dashboard
        broadcastToRole('editor', 'booking_status_changed', {
          bookingId: booking.bookingId,
          status: BookingStatus.ACCEPTED,
          partnerId: candidate.partnerId,
          editorId: booking.editorId
        });
        broadcastToRole('admin', 'booking_status_changed', {
          bookingId: booking.bookingId,
          status: BookingStatus.ACCEPTED,
          partnerId: candidate.partnerId
        });

        return {
          assigned: true,
          partnerId: candidate.partnerId,
          booking,
          attemptsCount: totalAttempts
        };
      } else {
        // Offer Timed out or Rejected
        console.log(`[Dispatch Fallback] Partner ${candidate.partnerId} did not accept booking ${booking.bookingId}. Retrying next partner...`);
        // Cancel active offer dialog on partner app
        io.to(candidate.socketId).emit('booking_offer_cancelled', {
          bookingId: booking.bookingId,
          reason: 'Offer expired or rejected'
        });
      }
    }
  }

  // Exhausted all radii without acceptance
  console.warn(`[Dispatch Failed] No partner accepted booking ${booking.bookingId} after ${totalAttempts} attempts.`);
  booking.status = BookingStatus.EXPIRED;
  activeBookingsMap.set(booking.bookingId, booking);

  broadcastToBooking(booking.bookingId, 'booking_status_changed', {
    bookingId: booking.bookingId,
    status: BookingStatus.EXPIRED,
    message: 'No available partner accepted your booking request'
  });

  return {
    assigned: false,
    booking,
    reason: 'NO_PARTNER_ACCEPTED',
    attemptsCount: totalAttempts
  };
}

function waitForPartnerResponse(bookingId: string, targetPartnerId: string): Promise<boolean> {
  return new Promise((resolve) => {
    let timer: NodeJS.Timeout;

    const responseHandler = (data: BookingResponsePayload) => {
      if (data.bookingId === bookingId && data.partnerId === targetPartnerId) {
        clearTimeout(timer);
        io.off(`booking_response:${bookingId}`, responseHandler);
        resolve(data.accepted === true);
      }
    };

    // Listen for response
    io.on(`booking_response:${bookingId}`, responseHandler);

    // 15 Second Timeout timer
    timer = setTimeout(async () => {
      io.off(`booking_response:${bookingId}`, responseHandler);

      // Record timeout metric
      await recordPartnerResponseMetric(targetPartnerId, 'timeout');

      // Send timeout notice to partner socket
      const socketId = onlinePartnerSockets.get(targetPartnerId);
      if (socketId) {
        io.to(socketId).emit('booking_timeout', {
          bookingId,
          message: '15 second response window expired'
        });
      }

      resolve(false);
    }, OFFER_TIMEOUT_MS);
  });
}
