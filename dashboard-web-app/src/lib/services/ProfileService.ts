/**
 * ProfileService — Orbit backend API client
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

export interface ProfileRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "CLIENT" | "PARTNER" | "EDITOR" | "ADMIN" | "SUPER_ADMIN";
  avatar?: string;
  avatarType?: string;
  persona?: string;
  isOnline?: boolean;
}

export class ProfileService {
  /** Fetch the current user's profile using the bearer token stored in localStorage. */
  static async getCurrentProfile(): Promise<ProfileRecord | null> {
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || data.profile || null;
    } catch {
      return null;
    }
  }

  /** Update a client or partner profile. */
  static async updateProfile(
    profileId: string,
    role: "CLIENT" | "PARTNER",
    updates: Partial<ProfileRecord>
  ): Promise<ProfileRecord | null> {
    const endpoint = role === "PARTNER" ? `${API}/partners/${profileId}` : `${API}/users/${profileId}`;
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.user || data.partner || null;
  }
}
