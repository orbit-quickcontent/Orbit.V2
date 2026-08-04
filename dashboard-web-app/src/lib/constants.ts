/**
 * Orbit - Shared Constants
 *
 * Application-wide constants used across Client and Partner frontends.
 * Single source of truth for avatar colors, avatars, and currency formatting.
 */

// Avatar gradient colors (used in login, profile views) - 7 colors
export const AVATAR_COLORS = [
  "from-orbit-cyan to-blue-500",
  "from-orbit-purple to-pink-500",
  "from-green-400 to-emerald-500",
  "from-orange-400 to-red-500",
  "from-yellow-400 to-amber-500",
  "from-violet-400 to-fuchsia-500",
  "from-rose-400 to-pink-500",
] as const;

// 5 Avatar presets matching Orbit reference UI
export const AVATAR_PRESETS = [
  { id: "creator", emoji: "👨🏻‍🦱", label: "Creator", color: "#FF4D4D", bg: "bg-[#FF4D4D]", gradient: "from-red-500 to-rose-600", description: "Content Creator", image: "/avatars/creator.png" },
  { id: "professional", emoji: "👨🏽‍💼", label: "Professional", color: "#3A82F6", bg: "bg-[#3A82F6]", gradient: "from-blue-500 to-indigo-600", description: "Business Professional", image: "/avatars/professional.png" },
  { id: "artist", emoji: "👩🏽‍🎨", label: "Artist", color: "#FFC107", bg: "bg-[#FFC107]", gradient: "from-amber-400 to-yellow-500", description: "Creative Artist", image: "/avatars/artist.png" },
  { id: "explorer", emoji: "🧑🏻‍🚀", label: "Explorer", color: "#00C853", bg: "bg-[#00C853]", gradient: "from-emerald-400 to-green-600", description: "Adventurous Explorer", image: "/avatars/explorer.png" },
  { id: "celebration", emoji: "🎉", label: "Celebration", color: "#B033FF", bg: "bg-[#B033FF]", gradient: "from-purple-500 to-fuchsia-600", description: "Event & Celebration", image: "/avatars/celebration.png" },
] as const;

// Format currency in Indian Rupees (₹)
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// Redownload window: 30 days in milliseconds
export const REDOWNLOAD_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// Check if a delivered booking is still within redownload window
export function isWithinRedownloadWindow(deliveredAt: string | null): boolean {
  if (!deliveredAt) return false;
  return Date.now() - new Date(deliveredAt).getTime() < REDOWNLOAD_WINDOW_MS;
}

// Get days remaining for redownload
export function getRedownloadDaysRemaining(deliveredAt: string | null): number {
  if (!deliveredAt) return 0;
  const elapsed = Date.now() - new Date(deliveredAt).getTime();
  const remaining = REDOWNLOAD_WINDOW_MS - elapsed;
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}
