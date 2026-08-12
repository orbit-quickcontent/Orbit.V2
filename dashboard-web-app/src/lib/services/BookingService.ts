/**
 * BookingService — Orbit backend API client
 * Replaces the old Supabase-based implementation.
 * All calls go through the backend API (NEXT_PUBLIC_API_URL or /api proxy).
 */

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem("orbit_token") || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface CreateBookingPayload {
  packageId: string;
  bookingDate: string;
  timeSlot: string;
  location?: string;
  notes?: string;
  razorpayPaymentId?: string;
}

export class BookingService {
  static async createBooking(payload: CreateBookingPayload) {
    const res = await fetch(`${API}/bookings`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.booking;
  }

  static async fetchClientBookings(userId?: string) {
    const params = userId ? `?userId=${userId}` : "";
    const res = await fetch(`${API}/bookings${params}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.bookings || [];
  }

  static async getBooking(bookingId: string) {
    const res = await fetch(`${API}/bookings/${bookingId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.booking;
  }

  static async updateBooking(bookingId: string, updates: Record<string, unknown>) {
    const res = await fetch(`${API}/bookings/${bookingId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.booking;
  }

  /** Poll booking status every intervalMs milliseconds. Returns a cleanup function. */
  static pollBooking(
    bookingId: string,
    onUpdate: (booking: any) => void,
    intervalMs = 5000
  ): () => void {
    const id = setInterval(async () => {
      try {
        const booking = await BookingService.getBooking(bookingId);
        onUpdate(booking);
      } catch {
        // ignore transient errors
      }
    }, intervalMs);
    return () => clearInterval(id);
  }
}
