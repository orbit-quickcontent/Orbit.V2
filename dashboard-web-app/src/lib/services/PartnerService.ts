/**
 * PartnerService — Orbit backend API client
 * Replaces the old Supabase-based implementation.
 */

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? (localStorage.getItem("orbit_token") || "") : "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export class PartnerService {
  /** Update partner GPS location via the backend. */
  static async updateGPSLocation(
    partnerId: string,
    lat: number,
    lng: number,
    _speed = 0,
    _heading = 0,
    _accuracy = 10
  ) {
    const res = await fetch(`${API}/partners/${partnerId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  /** Set partner online/offline status. */
  static async setStatus(partnerId: string, status: "ONLINE" | "OFFLINE" | "BUSY") {
    const availability = status === "ONLINE";
    const res = await fetch(`${API}/partners/${partnerId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ availability }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  /** Poll available bookings for the partner (fallback when WebSocket is unavailable). */
  static pollAvailableBookings(
    onUpdate: (bookings: any[]) => void,
    intervalMs = 5000
  ): () => void {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`${API}/bookings/available`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          onUpdate(data.bookings || []);
        }
      } catch {
        // ignore transient errors
      }
    }, intervalMs);
    return () => clearInterval(id);
  }
}
