/**
 * 🟣 PARTNER FRONTEND | Constants
 * 
 * Shared constants for the partner frontend: shot list definitions,
 * mock available bookings, and mock completed history for the partner dashboard.
 * 
 * Used by: partner-dashboard.tsx, shooting-phase.tsx
 * Category: Partner UI
 */

import { type BookingInfo } from "@/lib/types";

export const SHOT_LIST = [
  { id: "shot-1", name: "Establishing Shot", description: "Wide angle of location/venue" },
  { id: "shot-2", name: "Subject Intro", description: "Introduction of the main subject" },
  { id: "shot-3", name: "Action Sequence", description: "Key moments and activity" },
  { id: "shot-4", name: "B-Roll", description: "Detail shots and cutaway footage" },
  { id: "shot-5", name: "Closing Shot", description: "Final frame and wrap-up" },
];

export const MOCK_AVAILABLE_BOOKINGS: BookingInfo[] = [
  {
    id: "OL-AVAIL001", packageId: "pkg-professional", packageName: "Professional (UGC)",
    packagePrice: 4999, status: "PAID", paymentStatus: "SUCCESS",
    bookingDate: new Date(Date.now() + 86400000).toISOString(), timeSlot: "10:00 AM",
    location: "Connaught Place, New Delhi", syncPercentage: 0, editCountdown: null,
    partnerName: null, notes: "Brand shoot for tech startup. Need corporate aesthetic.",
    deliveredAt: null, downloaded: false, cancelledBy: null, declinedByPartners: [],
  },
  {
    id: "OL-AVAIL002", packageId: "pkg-personalized", packageName: "Personalized",
    packagePrice: 1999, status: "PAID", paymentStatus: "SUCCESS",
    bookingDate: new Date(Date.now() + 86400000).toISOString(), timeSlot: "02:00 PM",
    location: "Juhu Beach, Mumbai", syncPercentage: 0, editCountdown: null,
    partnerName: null, notes: "Pre-wedding candid reel. Golden hour preferred.",
    deliveredAt: null, downloaded: false, cancelledBy: null, declinedByPartners: [],
  },
  {
    id: "OL-AVAIL003", packageId: "pkg-professional", packageName: "Professional (UGC)",
    packagePrice: 4999, status: "PAID", paymentStatus: "SUCCESS",
    bookingDate: new Date(Date.now() + 172800000).toISOString(), timeSlot: "11:00 AM",
    location: "Koramangala, Bangalore", syncPercentage: 0, editCountdown: null,
    partnerName: null, notes: "Product launch video. Brand assets will be shared.",
    deliveredAt: null, downloaded: false, cancelledBy: null, declinedByPartners: [],
  },
];


