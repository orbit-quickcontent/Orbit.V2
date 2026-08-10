/**
 * ORBIT Client App Integration Sample
 * Demonstrates:
 * 1. Requesting nearby available partners via REST GET /api/partners/nearby
 * 2. Creating a shoot booking via REST POST /api/bookings
 * 3. Subscribing to real-time updates via Socket.IO room booking:<id>
 */

import { io, Socket } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

export interface NearbyPartner {
  partnerId: string;
  name: string;
  distanceKm: number;
  etaMinutes: number;
  rating: number;
}

/**
 * 1. Fetch nearby available partners sorted by ETA
 */
export async function getNearbyPartners(
  lat: number = 19.0728,
  lng: number = 72.8826,
  radiusKm: number = 5
): Promise<NearbyPartner[]> {
  const response = await fetch(
    `${API_BASE_URL}/partners/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch nearby partners: ${response.statusText}`);
  }
  return (await response.json()) as NearbyPartner[];
}

/**
 * 2. Request a shoot booking and trigger partner dispatch engine
 */
export async function createBooking(payload: {
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
}): Promise<{ id: string; status: string }> {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Booking creation failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.booking;
}

/**
 * 3. Subscribe to real-time booking updates over Socket.IO
 */
export function subscribeToBookingUpdates(
  bookingId: string,
  callbacks: {
    onStatusChanged: (data: { status: string; partnerId?: string; message?: string }) => void;
    onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
  }
): Socket {
  const socket: Socket = io(SOCKET_URL, {
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log(`[CLIENT_SOCKET] Connected with ID ${socket.id}`);
    // Subscribe to room booking:<bookingId>
    socket.emit('client:subscribeBooking', { bookingId });
  });

  socket.on('booking:statusChanged', (data) => {
    console.log(`[CLIENT_SOCKET] Booking ${bookingId} status changed:`, data);
    callbacks.onStatusChanged(data);
  });

  socket.on('booking:locationUpdate', (data) => {
    console.log(`[CLIENT_SOCKET] Partner live position:`, data);
    if (callbacks.onLocationUpdate) {
      callbacks.onLocationUpdate(data);
    }
  });

  return socket;
}
