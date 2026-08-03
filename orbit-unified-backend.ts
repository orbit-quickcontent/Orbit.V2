/**
 * ============================================================================
 * ORBIT V2 - MASTER UNIFIED BACKEND SERVICE HUB
 * ============================================================================
 * File Location: c:\Users\utkar\OneDrive\Documents\Desktop\Orbit\orbit-unified-backend.ts
 * 
 * Standalone central backend integration engine that connects ALL Orbit applications:
 * 1. Android Client App (com.orbitlogic.client / com.orbit.client)
 * 2. Android Partner App (com.orbitlogic.partner / com.orbit.partner)
 * 3. Creator/Dashboard Web App (dashboard-web-app)
 * 4. Editor Web App (editor-web-app)
 * 5. Node.js Express API Server & Socket.IO Realtime Engine
 * 
 * Pre-configured Credentials & Services:
 * - Firebase Project ID: orbit-99e42 (Project Number 1086714107107)
 * - TomTom Maps API Key: 3QgWDfdOUKX7Kzs6GTrckM9HSidyvRIX
 * - Dual Storage & Database Engine: Firebase Firestore & Supabase Postgres
 * ============================================================================
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  updateDoc 
} from "firebase/firestore";

// Firebase Project Credentials for orbit-99e42
export const FIREBASE_CONFIG = {
  projectId: "orbit-99e42",
  storageBucket: "orbit-99e42.firebasestorage.app",
  apiKey: "AIzaSyAnBPU5tA4vLl2zzGlFUx8-kwSNtt54xMc",
  authDomain: "orbit-99e42.firebaseapp.com",
};

// TomTom Maps API Configuration
export const TOMTOM_CONFIG = {
  apiKey: "3QgWDfdOUKX7Kzs6GTrckM9HSidyvRIX",
  tileUrl: "https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?view=Unified&key=3QgWDfdOUKX7Kzs6GTrckM9HSidyvRIX",
};

// Initialize Firebase App instance safely
const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
export const db = getFirestore(app);

// Data Models
export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  name: string;
  full_name: string;
  phone?: string;
  role: "CLIENT" | "PARTNER" | "EDITOR" | "ADMIN";
  persona?: string;
  isOnline: boolean;
  avatarUrl?: string;
  updatedAt: string;
}

export interface BookingSession {
  id: string;
  clientId: string;
  clientName: string;
  packageId: string;
  packageName: string;
  amount: number;
  status: "PENDING" | "DISPATCHED" | "EN_ROUTE" | "SHOOTING" | "SYNCING" | "EDITING" | "DELIVERED" | "CANCELLED";
  date: string;
  time: string;
  location: string;
  coordinates?: { latitude: number; longitude: number };
  partnerId?: string;
  partnerName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerLocationUpdate {
  partnerId: string;
  bookingId?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface MediaDeliveryItem {
  id: string;
  bookingId: string;
  editorId: string;
  mediaUrls: string[];
  status: "PROCESSING" | "READY" | "REJECTED";
  deliveredAt: string;
}

/**
 * Master Unified Backend Class
 */
export class OrbitUnifiedBackend {
  private static instance: OrbitUnifiedBackend;

  private constructor() {}

  public static getInstance(): OrbitUnifiedBackend {
    if (!OrbitUnifiedBackend.instance) {
      OrbitUnifiedBackend.instance = new OrbitUnifiedBackend();
    }
    return OrbitUnifiedBackend.instance;
  }

  // 1. Sync User across Android & Web Apps to Firestore 'users' collection
  public async syncUser(user: UserProfile): Promise<boolean> {
    try {
      if (!db) return false;
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, {
        ...user,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`[OrbitUnifiedBackend] User synced: ${user.email}`);
      return true;
    } catch (err) {
      console.error("[OrbitUnifiedBackend] Error syncing user:", err);
      return false;
    }
  }

  // 2. Fetch User Profile
  public async getUser(userId: string): Promise<UserProfile | null> {
    try {
      if (!db) return null;
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (err) {
      console.error("[OrbitUnifiedBackend] Error getting user:", err);
      return null;
    }
  }

  // 3. Create new shoot booking (Book Now / Configure Session)
  public async createBooking(booking: Omit<BookingSession, "id" | "createdAt" | "updatedAt" | "status">): Promise<BookingSession | null> {
    try {
      if (!db) return null;
      const bookingId = `bk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const now = new Date().toISOString();
      const newSession: BookingSession = {
        ...booking,
        id: bookingId,
        status: "PENDING",
        createdAt: now,
        updatedAt: now
      };

      await setDoc(doc(db, "bookings", bookingId), newSession);
      console.log(`[OrbitUnifiedBackend] Booking created: ${bookingId}`);
      return newSession;
    } catch (err) {
      console.error("[OrbitUnifiedBackend] Error creating booking:", err);
      return null;
    }
  }

  // 4. Fetch Booking
  public async getBooking(bookingId: string): Promise<BookingSession | null> {
    try {
      if (!db) return null;
      const bDoc = await getDoc(doc(db, "bookings", bookingId));
      if (bDoc.exists()) {
        return bDoc.data() as BookingSession;
      }
      return null;
    } catch (err) {
      console.error("[OrbitUnifiedBackend] Error getting booking:", err);
      return null;
    }
  }

  // 5. Dispatch Partner & Update Booking Status
  public async updateBookingStatus(bookingId: string, status: BookingSession["status"], partnerId?: string, partnerName?: string): Promise<boolean> {
    try {
      if (!db) return false;
      const bookingRef = doc(db, "bookings", bookingId);
      const updateData: Record<string, any> = {
        status,
        updatedAt: new Date().toISOString()
      };
      if (partnerId) updateData.partnerId = partnerId;
      if (partnerName) updateData.partnerName = partnerName;

      await updateDoc(bookingRef, updateData);
      console.log(`[OrbitUnifiedBackend] Booking ${bookingId} status updated to: ${status}`);
      return true;
    } catch (err) {
      console.error("[OrbitUnifiedBackend] Error updating booking status:", err);
      return false;
    }
  }

  // 6. Realtime GPS Location Tracking for Partners (TomTom Maps Integration)
  public async updatePartnerGPS(loc: PartnerLocationUpdate): Promise<boolean> {
    try {
      if (!db) return false;
      const locRef = doc(db, "partner_locations", loc.partnerId);
      await setDoc(locRef, {
        ...loc,
        timestamp: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (err) {
      console.error("[OrbitUnifiedBackend] Error updating GPS location:", err);
      return false;
    }
  }

  // 7. Editor Delivery Sync
  public async deliverMedia(delivery: MediaDeliveryItem): Promise<boolean> {
    try {
      if (!db) return false;
      const delRef = doc(db, "deliveries", delivery.bookingId);
      await setDoc(delRef, {
        ...delivery,
        deliveredAt: new Date().toISOString()
      }, { merge: true });

      await this.updateBookingStatus(delivery.bookingId, "DELIVERED");
      console.log(`[OrbitUnifiedBackend] Media delivered for booking: ${delivery.bookingId}`);
      return true;
    } catch (err) {
      console.error("[OrbitUnifiedBackend] Error delivering media:", err);
      return false;
    }
  }

  // 8. Realtime Booking Listener (Live Status Sync across Web & Mobile)
  public onBookingChange(bookingId: string, callback: (booking: BookingSession | null) => void): () => void {
    if (!db) return () => {};
    return onSnapshot(doc(db, "bookings", bookingId), (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as BookingSession);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("[OrbitUnifiedBackend] Realtime booking listener error:", error);
    });
  }

  // 9. Realtime Partner Location Listener (Live TomTom Map Sync)
  public onPartnerLocationChange(partnerId: string, callback: (location: PartnerLocationUpdate | null) => void): () => void {
    if (!db) return () => {};
    return onSnapshot(doc(db, "partner_locations", partnerId), (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as PartnerLocationUpdate);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("[OrbitUnifiedBackend] Realtime GPS listener error:", error);
    });
  }
}

export const orbitMasterBackend = OrbitUnifiedBackend.getInstance();
export default orbitMasterBackend;
