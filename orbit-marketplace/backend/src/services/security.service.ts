import crypto from "crypto";

// Encryption key must be exactly 32 bytes (256 bits)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "orbit_bank_secret_enc_key_2026_x"; // 32 chars
const ALGORITHM = "aes-256-cbc";

/**
 * Encrypt bank account number using AES-256-CBC with random IV.
 * Returns IV and encrypted ciphertext joined by a colon.
 */
export function encryptAccountNumber(accountNumber: string): string {
  if (!accountNumber) return "";
  
  // Format key to exactly 32 bytes
  const key = Buffer.alloc(32);
  Buffer.from(ENCRYPTION_KEY, "utf8").copy(key);
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(accountNumber, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt bank account number using AES-256-CBC.
 */
export function decryptAccountNumber(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(":")) return "";
  
  try {
    const key = Buffer.alloc(32);
    Buffer.from(ENCRYPTION_KEY, "utf8").copy(key);
    
    const [ivHex, encryptedHex] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("[Security Service] Decryption failed:", error);
    return "";
  }
}

/**
 * Mask account number to expose only the last 4 digits.
 * Format: XXXXXX4321
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber) return "";
  if (accountNumber.length <= 4) return accountNumber;
  const lastFour = accountNumber.slice(-4);
  return `XXXXXX${lastFour}`;
}
