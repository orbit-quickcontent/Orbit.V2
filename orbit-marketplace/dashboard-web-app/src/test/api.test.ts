import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../lib/crypto";
import { validateBody, userSchema, bookingSchema } from "../lib/validation";

describe("Cryptography Helpers", () => {
  it("should securely hash and verify passwords", () => {
    const password = "SuperSecretPassword123!";
    const hashedPassword = hashPassword(password);

    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).toContain(":");

    const isValid = verifyPassword(password, hashedPassword);
    expect(isValid).toBe(true);

    const isInvalid = verifyPassword("WrongPassword", hashedPassword);
    expect(isInvalid).toBe(false);
  });
});

describe("Zod Validation Schemas", () => {
  it("should validate a correct user profile body", () => {
    const validUser = {
      email: "user@example.com",
      name: "John Doe",
      phone: "+919876543210",
      role: "USER",
    };

    const result = validateBody(userSchema, validUser);
    expect(result.success).toBe(true);
  });

  it("should reject an invalid email address", () => {
    const invalidUser = {
      email: "not-an-email",
      name: "John Doe",
    };

    const result = validateBody(userSchema, invalidUser);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain("email");
    }
  });

  it("should reject a booking with missing slots", () => {
    const invalidBooking = {
      userId: "clq1234560000yyxxzzwwuuaa",
      packageId: "clq6543210000wwxxyyzzuubb",
      bookingDate: new Date().toISOString(),
      location: "Studio 5",
    };

    const result = validateBody(bookingSchema, invalidBooking);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
