export enum PartnerStatus {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  BUSY = 'BUSY',
  ON_TRIP = 'ON_TRIP',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  EN_ROUTE = 'EN_ROUTE',
  SHOOTING = 'SHOOTING',
  EDITING = 'EDITING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface PartnerLocationUpdate {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
}

export interface NearbyPartner {
  partnerId: string;
  name: string;
  phone?: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  etaMinutes: number;
  rating: number;
  status: PartnerStatus;
}

export interface Booking {
  id: string;
  clientId: string;
  partnerId?: string | null;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BookingOfferPayload {
  bookingId: string;
  clientId: string;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  distanceKm: number;
  etaMinutes: number;
  expiresInSeconds: number;
}
