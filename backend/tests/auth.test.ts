import { describe, it, expect, beforeAll } from "vitest";
import { signToken, verifyToken, normalizeRole } from "../src/lib/security-auth";

describe("Auth Security & JWT Middleware", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-key-must-be-at-least-16-chars-long";
  });

  it("should correctly sign and verify a valid JWT token", () => {
    const payload = {
      id: "usr-123",
      email: "test@orbitlogic.io",
      role: "CLIENT",
    };

    const token = signToken(payload, 3600);
    expect(token).toBeDefined();

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe("usr-123");
    expect(decoded?.email).toBe("test@orbitlogic.io");
    expect(decoded?.role).toBe("CLIENT");
  });

  it("should reject expired JWT tokens", () => {
    const payload = {
      id: "usr-expired",
      email: "expired@orbitlogic.io",
      role: "CLIENT",
    };

    // Sign with negative expiration (already expired 10 seconds ago)
    const token = signToken(payload, -10);
    const decoded = verifyToken(token);
    expect(decoded).toBeNull();
  });

  it("should reject tampered JWT token signatures", () => {
    const payload = {
      id: "usr-legit",
      email: "legit@orbitlogic.io",
      role: "CLIENT",
    };

    const token = signToken(payload, 3600);
    const parts = token.split(".");
    const tamperedToken = `${parts[0]}.${parts[1]}.invalidSignature123`;

    const decoded = verifyToken(tamperedToken);
    expect(decoded).toBeNull();
  });

  it("should correctly normalize roles", () => {
    expect(normalizeRole("user")).toBe("CLIENT");
    expect(normalizeRole("PARTNER")).toBe("PARTNER");
    expect(normalizeRole("shooter")).toBe("PARTNER");
    expect(normalizeRole("EDITOR")).toBe("EDITOR");
    expect(normalizeRole("admin")).toBe("ADMIN");
    expect(normalizeRole("superadmin")).toBe("SUPER_ADMIN");
  });
});
