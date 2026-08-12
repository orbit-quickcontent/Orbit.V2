export enum BookingStatus {
  PENDING = 'PENDING',
  SEARCHING = 'SEARCHING',
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED',
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  SHOOTING = 'SHOOTING',
  UPLOADING = 'UPLOADING',
  EDITING = 'EDITING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export type UserRole = 'CLIENT' | 'PARTNER' | 'EDITOR' | 'ADMIN';

export interface UserJwtPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  iat?: number;
  exp?: number;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  speed?: number;
  heading?: number;
  timestamp?: number;
}

export interface FirestoreBooking {
  bookingId: string;
  clientId: string;
  clientName: string;
  partnerId: string | null;
  partnerName?: string | null;
  editorId: string | null;
  status: BookingStatus;
  clientLocation: GeoLocation;
  partnerLocation: GeoLocation | null;
  createdAt: string;
  assignedAt: string | null;
  acceptedAt: string | null;
  arrivedAt: string | null;
  shootingStartedAt: string | null;
  rawFootageUrls: string[];
  reelUrl: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  price: number;
  platformFee: number;
  partnerEarning: number;
  editorEarning: number;
  offeredPartnerIds?: string[];
}

export interface PartnerPresence {
  partnerId: string;
  socketId: string;
  isOnline: boolean;
  lastSeenAt: number;
  activeBookingsCount: number;
  totalAccepted: number;
  totalRejected: number;
  totalTimedOut: number;
  location: GeoLocation | null;
}

export interface DispatchSearchResult {
  assigned: boolean;
  partnerId?: string;
  booking?: FirestoreBooking;
  reason?: string;
  attemptsCount?: number;
}

export interface SocketLocationUpdatePayload {
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  timestamp?: number;
}

export interface NewBookingOfferPayload {
  bookingId: string;
  clientLat: number;
  clientLng: number;
  clientAddress?: string;
  distanceKm: number;
  price: number;
  timeoutSeconds: number;
  createdAt: string;
}

export interface BookingResponsePayload {
  bookingId: string;
  partnerId: string;
  accepted: boolean;
  reason?: string;
}
