/**
 * Vitest — JWT Authentication, Tokens & RBAC Security Tests
 */

import { describe, it, expect } from "vitest";
import { signToken, verifyToken, normalizeRole } from "../src/lib/security-auth";

describe("Hardened JWT Authentication & RBAC", () => {
  it("should generate and verify 15-minute access tokens", () => {
    const payload = {
      id: "usr_client_1",
      email: "client@orbit.app",
      name: "Orbit Client",
      role: "CLIENT",
      type: "access" as const,
    };

    const token = signToken(payload, 15 * 60);
    expect(typeof token).toBe("string");

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe("usr_client_1");
    expect(decoded?.email).toBe("client@orbit.app");
    expect(decoded?.role).toBe("CLIENT");
  });

  it("should generate and verify 30-day refresh tokens", () => {
    const payload = {
      id: "usr_partner_1",
      email: "partner@orbit.app",
      role: "PARTNER",
      type: "refresh" as const,
    };

    const token = signToken(payload, 30 * 24 * 60 * 60);
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe("usr_partner_1");
    expect(decoded?.type).toBe("refresh");
  });

  it("should reject tampered or invalid tokens", () => {
    const validToken = signToken({ id: "usr_1", email: "a@b.com", role: "CLIENT" });
    const tampered = validToken.slice(0, -5) + "abcde";
    expect(verifyToken(tampered)).toBeNull();
    expect(verifyToken("")).toBeNull();
    expect(verifyToken("invalid.token.structure")).toBeNull();
  });

  it("should normalize role names correctly", () => {
    expect(normalizeRole("CLIENT")).toBe("CLIENT");
    expect(normalizeRole("USER")).toBe("CLIENT");
    expect(normalizeRole("PARTNER")).toBe("PARTNER");
    expect(normalizeRole("EDITOR")).toBe("EDITOR");
    expect(normalizeRole("SUPER_ADMIN")).toBe("SUPER_ADMIN");
  });
});
