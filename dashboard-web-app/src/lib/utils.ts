/**
 * 🟠 CORE | Utility Functions
 * 
 * Shared utility functions used across the application.
 * Currently provides the `cn()` function for merging Tailwind CSS classes.
 * 
 * Used by: All UI components
 * Category: Core
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get initials from a name string.
 * Returns "?" for empty names, first letter for single names,
 * or first + last initial for multi-word names.
 */
export function getInitials(name: string): string {
  if (!name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

/**
 * Get a time-of-day greeting string.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
