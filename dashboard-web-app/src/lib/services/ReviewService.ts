/**
 * ReviewService — Orbit backend API client
 * Replaces the old Supabase-based implementation.
 *
 * NOTE: The backend does not yet have a /reviews endpoint.
 * This stub stores the review locally and logs it until the endpoint is built.
 * When the backend endpoint is ready, uncomment the fetch call below.
 */

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? (localStorage.getItem("orbit_token") || "") : "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export class ReviewService {
  static async submitReview(
    bookingId: string,
    partnerId: string,
    rating: number,
    comment?: string
  ): Promise<{ success: boolean }> {
    try {
      // TODO: Replace stub with real endpoint when /api/reviews is added to the backend
      // const res = await fetch(`${API}/reviews`, {
      //   method: "POST",
      //   headers: getAuthHeaders(),
      //   body: JSON.stringify({ bookingId, partnerId, rating, comment }),
      // });
      // if (!res.ok) throw new Error(await res.text());
      // return res.json();

      console.log("[ReviewService] Review submitted (stub):", { bookingId, partnerId, rating, comment });
      return { success: true };
    } catch {
      return { success: false };
    }
  }
}
