import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Hash a password using Node.js native scrypt.
 * Format: salt:hash (hex encoded)
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const computedHash = scryptSync(password, salt, 64);
    const hashBuffer = Buffer.from(hash, "hex");
    return timingSafeEqual(hashBuffer, computedHash);
  } catch {
    return false;
  }
}
