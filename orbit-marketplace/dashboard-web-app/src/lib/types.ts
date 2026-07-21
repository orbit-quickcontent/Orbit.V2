/**
 * Orbit - Shared Type Definitions
 *
 * Core types for Client and Partner frontends.
 */

export type AppView = "landing" | "packages" | "booking" | "tracking" | "partner" | "partner-work" | "partner-earnings" | "partner-settings" | "profile";

export type BookingStatus =
  | "PENDING"
  | "PAID"
  | "PARTNER_DISPATCHED"
  | "EN_ROUTE"
  | "SHOOTING"
  | "SYNCING"
  | "READY_TO_EDIT"
  | "EDITING"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PROCESSING" | "SUCCESS" | "FAILED" | "REFUNDED";

export type UserRole = "USER" | "PARTNER";

export type AppPhase = "splash" | "auth" | "app";

export interface PackageInfo {
  id: string;
  name: string;
  tier: string;
  price: number;
  focus: string;
  deliveryTime: string;
  features: string[];
  popular: boolean;
}

export interface BookingInfo {
  id: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  bookingDate: string;
  timeSlot: string;
  location: string;
  syncPercentage: number;
  editCountdown: number | null;
  partnerName: string | null;
  notes: string;
  /** ISO date when booking was delivered (for redownload window) */
  deliveredAt: string | null;
  /** Whether client has downloaded the final edit */
  downloaded: boolean;
  /** Who cancelled the booking (if CANCELLED) */
  cancelledBy: "CLIENT" | "PARTNER" | null;
  /** Partner IDs that declined this booking (for reassignment) */
  declinedByPartners: string[];
  reelUrl?: string;
  masterReelUrl?: string;
  hlsPlaylistUrl?: string;
  proxyFootageUrl?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  isVerified: boolean;
  linkedAt: string;
}

export interface PartnerWallet {
  balance: number;
  pendingClearance: number;
  totalWithdrawn: number;
  lastWithdrawnAt: string | null;
}

export interface PartnerSettings {
  notificationsEnabled: boolean;
  newBookingAlerts: boolean;
  paymentAlerts: boolean;
  autoSyncOnWifi: boolean;
  highQualityUpload: boolean;
  locationTracking: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  avatar: string | null;
  avatarType: "color" | "avatar" | "photo";
  avatarEmoji: string | null;
  avatarPhotoUrl: string | null;
  avatarImage: string | null;
  brandLogo: string | null;
  brandFont: string | null;
  brandColor: string | null;
  editorRequirements: string;
  /** Auth provider used for sign-in */
  authProvider: "email" | "google" | "apple" | null;
  /** Whether partner is online (accepting bookings) */
  isOnline: boolean;
  /** Partner bank account for withdrawals */
  bankAccount: BankAccount | null;
  /** Partner wallet balance */
  wallet: PartnerWallet;
  /** Partner app settings */
  settings: PartnerSettings;
  /** Partner verification status */
  isVerified: boolean;
}

export interface ReviewInfo {
  bookingId: string;
  partnerRating: number;
  editorRating: number;
  feedback: string;
}
