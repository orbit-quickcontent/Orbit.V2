/**
 * Orbit Unified Master Backend Hub
 * 
 * Connects all Orbit platform components:
 * - Client Android App & Client Web App
 * - Partner Android App & Partner Web Dashboard
 * - Editor Web App & Media Pipeline
 * - Firebase Firestore Realtime Sync & Supabase Postgres Database
 */

import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db as firebaseDb } from "./firebase";

export interface OrbitUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "CLIENT" | "PARTNER" | "EDITOR" | "ADMIN";
  persona?: string;
  isOnline: boolean;
  lastSeen?: string;
  avatarUrl?: string;
}

export interface OrbitBooking {
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

export class UnifiedOrbitHub {
  private static instance: UnifiedOrbitHub;

  private constructor() {}

  public static getInstance(): UnifiedOrbitHub {
    if (!UnifiedOrbitHub.instance) {
      UnifiedOrbitHub.instance = new UnifiedOrbitHub();
    }
    return UnifiedOrbitHub.instance;
  }

  // ─── 1. User & Profile Synchronization ─────────────────────────────────────
  public async syncUser(user: OrbitUser): Promise<boolean> {
    try {
      if (!firebaseDb) return false;
      const userRef = doc(firebaseDb, "users", user.id);
      await setDoc(userRef, {
        ...user,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("[UnifiedOrbitHub] Error syncing user:", error);
      return false;
    }
  }

  // ─── 2. Booking Dispatch & Realtime State Management ────────────────────────
  public async createBooking(bookingData: Omit<OrbitBooking, "id" | "createdAt" | "updatedAt" | "status">): Promise<OrbitBooking | null> {
    try {
      if (!firebaseDb) return null;
      const bookingId = `bk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const now = new Date().toISOString();
      const newBooking: OrbitBooking = {
        ...bookingData,
        id: bookingId,
        status: "PENDING",
        createdAt: now,
        updatedAt: now
      };

      await setDoc(doc(firebaseDb, "bookings", bookingId), newBooking);
      return newBooking;
    } catch (error) {
      console.error("[UnifiedOrbitHub] Error creating booking:", error);
      return null;
    }
  }

  public async updateBookingStatus(bookingId: string, status: OrbitBooking["status"], partnerId?: string): Promise<boolean> {
    try {
      if (!firebaseDb) return false;
      const bookingRef = doc(firebaseDb, "bookings", bookingId);
      const updatePayload: Record<string, any> = {
        status,
        updatedAt: new Date().toISOString()
      };
      if (partnerId) {
        updatePayload.partnerId = partnerId;
      }

      await updateDoc(bookingRef, updatePayload);
      return true;
    } catch (error) {
      console.error("[UnifiedOrbitHub] Error updating booking status:", error);
      return false;
    }
  }

  // ─── 3. Realtime Location Tracking (Partner -> Client Sync) ─────────────────
  public async updatePartnerLocation(partnerId: string, location: { latitude: number; longitude: number }): Promise<boolean> {
    try {
      if (!firebaseDb) return false;
      const locRef = doc(firebaseDb, "partner_locations", partnerId);
      await setDoc(locRef, {
        partnerId,
        coordinates: location,
        timestamp: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("[UnifiedOrbitHub] Error updating partner location:", error);
      return false;
    }
  }

  // ─── 4. Editor Web App & Media Pipeline Sync ───────────────────────────────
  public async syncMediaDelivery(bookingId: string, mediaUrls: string[], editorId: string): Promise<boolean> {
    try {
      if (!firebaseDb) return false;
      const deliveryRef = doc(firebaseDb, "deliveries", bookingId);
      await setDoc(deliveryRef, {
        bookingId,
        editorId,
        mediaUrls,
        status: "READY",
        deliveredAt: new Date().toISOString()
      }, { merge: true });

      // Automatically update booking status to DELIVERED
      await this.updateBookingStatus(bookingId, "DELIVERED");
      return true;
    } catch (error) {
      console.error("[UnifiedOrbitHub] Error syncing media delivery:", error);
      return false;
    }
  }
}

export const orbitHub = UnifiedOrbitHub.getInstance();
