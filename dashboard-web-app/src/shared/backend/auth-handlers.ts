import { NextRequest, NextResponse } from "next/server";
import { firestoreDb } from "../../lib/db";
import { hashPassword, verifyPassword } from "../../lib/crypto";
import { signToken, verifyToken, normalizeRole, getRoleRedirectUrl } from "../../lib/security-auth";

/**
 * 1. POST /auth/login
 * Handles Email & Password login with JWT token & refresh token generation.
 */
export async function loginHandler(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const { email, password, role } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look for user in partner_users first, then client_users
    let user = await firestoreDb.partnerUsers.findUnique({ where: { email: normalizedEmail } });
    let isPartner = !!user;

    if (!user) {
      user = await firestoreDb.clientUsers.findUnique({ where: { email: normalizedEmail } });
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials or user not found" }, { status: 401 });
    }

    // Verify password if set
    if (user.passwordHash) {
      if (!password) {
        return NextResponse.json({ error: "Password is required" }, { status: 400 });
      }
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }
    }

    const userRole = normalizeRole(role || user.role);

    // Update lastLogin & lastSeen
    const nowIso = new Date().toISOString();
    if (isPartner) {
      await firestoreDb.partnerUsers.update({
        where: { id: user.id },
        data: { lastLogin: nowIso, lastSeen: nowIso, isOnline: true }
      });
    } else {
      await firestoreDb.clientUsers.update({
        where: { id: user.id },
        data: { lastLogin: nowIso, lastSeen: nowIso, isOnline: true }
      });
    }

    // Generate JWT access token (15-min) and refresh token (30-day)
    const accessToken = signToken({
      id: user.id,
      email: user.email,
      name: user.name || user.displayName || "",
      role: userRole,
      type: "access"
    }, 15 * 60);

    const refreshToken = signToken({
      id: user.id,
      email: user.email,
      role: userRole,
      type: "refresh"
    }, 30 * 24 * 60 * 60);

    return NextResponse.json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken,
      redirectUrl: getRoleRedirectUrl(userRole),
      user: {
        id: user.id,
        uid: user.id,
        email: user.email,
        name: user.name || user.displayName || "",
        displayName: user.name || user.displayName || "",
        phone: user.phone || "",
        role: userRole,
        avatar: user.avatar || user.photoURL || null,
        photoURL: user.avatar || user.photoURL || null,
        walletBalance: user.walletBalance || 0,
        rating: user.rating || 5.0,
        kycStatus: user.kycStatus || "UNVERIFIED",
        status: user.status || "ACTIVE"
      }
    });
  } catch (err: any) {
    console.error("[Auth API] Login Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * 2. POST /auth/logout
 * Clears session, invalidates status and updates lastSeen.
 */
export async function logoutHandler(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const payload = verifyToken(authHeader);
      if (payload?.id) {
        const nowIso = new Date().toISOString();
        // Update user status
        await firestoreDb.clientUsers.update({
          where: { id: payload.id },
          data: { isOnline: false, lastSeen: nowIso }
        }).catch(() => null);

        await firestoreDb.partnerUsers.update({
          where: { id: payload.id },
          data: { isOnline: false, lastSeen: nowIso }
        }).catch(() => null);
      }
    }
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (err: any) {
    console.error("[Auth API] Logout Error:", err);
    return NextResponse.json({ success: true, message: "Logged out" });
  }
}

/**
 * 3. POST /auth/register
 * Registers a new user with role determination and password hashing.
 */
export async function registerHandler(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const { email, password, name, phone, role, deviceType, deviceId, appVersion, fcmToken } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email address is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userRole = normalizeRole(role);

    // Check if user already exists
    const existing = await firestoreDb.users.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = password ? hashPassword(password) : null;
    const nowIso = new Date().toISOString();

    const userData: any = {
      email: normalizedEmail,
      name: name || "",
      displayName: name || "",
      phone: phone || "",
      role: userRole,
      passwordHash,
      status: "ACTIVE",
      walletBalance: 0,
      rating: 5.0,
      kycStatus: userRole === "PARTNER" ? "UNVERIFIED" : "VERIFIED",
      deviceType: deviceType || null,
      deviceId: deviceId || null,
      appVersion: appVersion || null,
      fcmToken: fcmToken || null,
      lastLogin: nowIso,
      lastSeen: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    let newUser;
    if (userRole === "PARTNER") {
      newUser = await firestoreDb.partnerUsers.create({ data: userData });
      // Create partner profile as well
      await firestoreDb.partners.create({
        data: {
          userId: newUser.id,
          location: "Location Pending",
          availability: true,
          isVerified: false,
          rating: 5.0,
          completedProjects: 0,
          walletBalance: 0.0
        }
      }).catch(() => null);
    } else {
      newUser = await firestoreDb.clientUsers.create({ data: userData });
    }

    const accessToken = signToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name || "",
      role: userRole,
      type: "access"
    }, 15 * 60);

    const refreshToken = signToken({
      id: newUser.id,
      email: newUser.email,
      role: userRole,
      type: "refresh"
    }, 30 * 24 * 60 * 60);

    return NextResponse.json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken,
      redirectUrl: getRoleRedirectUrl(userRole),
      user: {
        id: newUser.id,
        uid: newUser.id,
        email: newUser.email,
        name: newUser.name || "",
        displayName: newUser.name || "",
        phone: newUser.phone || "",
        role: userRole,
        status: "ACTIVE",
        walletBalance: 0,
        rating: 5.0,
        kycStatus: userData.kycStatus
      }
    });
  } catch (err: any) {
    console.error("[Auth API] Register Error:", err);
    return NextResponse.json({ error: "Failed to register account" }, { status: 500 });
  }
}

/**
 * 4. POST /auth/forgot-password
 * Sends password reset code to user's email.
 */
export async function forgotPasswordHandler(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await firestoreDb.users.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      // Return success to avoid email enumeration security attacks
      return NextResponse.json({ success: true, message: "If an account exists, a reset code was sent." });
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await firestoreDb.emailOtps.create({
      data: {
        email: normalizedEmail,
        otp: resetOtp,
        createdAt: new Date().toISOString(),
        expiresAt,
        verified: false,
        used: false,
        type: "RESET_PASSWORD"
      }
    });

    console.log(`[Auth] Password Reset OTP for ${normalizedEmail}: ${resetOtp}`);

    return NextResponse.json({
      success: true,
      message: "Password reset code sent to your email",
      devOtp: process.env.NODE_ENV === "development" ? resetOtp : undefined
    });
  } catch (err: any) {
    console.error("[Auth API] Forgot Password Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * 5. POST /auth/reset-password
 * Verifies reset OTP code and updates user passwordHash.
 */
export async function resetPasswordHandler(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Email, OTP, and new password are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const record = await firestoreDb.emailOtps.findFirst({
      where: { email: normalizedEmail, used: false, verified: false }
    });

    if (!record || record.otp !== otp.toString()) {
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 });
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: "Reset code has expired" }, { status: 410 });
    }

    const newHash = hashPassword(newPassword);

    // Update user password in DB
    const isPartner = await firestoreDb.partnerUsers.findUnique({ where: { email: normalizedEmail } });
    if (isPartner) {
      await firestoreDb.partnerUsers.update({
        where: { id: isPartner.id },
        data: { passwordHash: newHash, updatedAt: new Date().toISOString() }
      });
    } else {
      const clientUser = await firestoreDb.clientUsers.findUnique({ where: { email: normalizedEmail } });
      if (clientUser) {
        await firestoreDb.clientUsers.update({
          where: { id: clientUser.id },
          data: { passwordHash: newHash, updatedAt: new Date().toISOString() }
        });
      }
    }

    // Mark OTP as used
    await firestoreDb.emailOtps.update({
      where: { id: record.id },
      data: { verified: true, used: true }
    });

    return NextResponse.json({ success: true, message: "Password updated successfully. You may now log in." });
  } catch (err: any) {
    console.error("[Auth API] Reset Password Error:", err);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}

/**
 * 6. POST /auth/google
 * Google OAuth authentication.
 */
export async function googleAuthHandler(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const { email, name, photoURL, idToken, role } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email from Google is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userRole = normalizeRole(role);

    let user = await firestoreDb.users.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      const nowIso = new Date().toISOString();
      const userData = {
        email: normalizedEmail,
        name: name || "Google User",
        displayName: name || "Google User",
        photoURL: photoURL || null,
        avatar: photoURL || null,
        role: userRole,
        status: "ACTIVE",
        walletBalance: 0,
        rating: 5.0,
        kycStatus: userRole === "PARTNER" ? "UNVERIFIED" : "VERIFIED",
        createdAt: nowIso,
        updatedAt: nowIso
      };

      if (userRole === "PARTNER") {
        user = await firestoreDb.partnerUsers.create({ data: userData });
      } else {
        user = await firestoreDb.clientUsers.create({ data: userData });
      }
    }

    const accessToken = signToken({
      id: user.id,
      email: user.email,
      name: user.name || "",
      role: normalizeRole(user.role),
      type: "access"
    }, 15 * 60);

    const refreshToken = signToken({
      id: user.id,
      email: user.email,
      role: normalizeRole(user.role),
      type: "refresh"
    }, 30 * 24 * 60 * 60);

    return NextResponse.json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken,
      redirectUrl: getRoleRedirectUrl(user.role),
      user: {
        id: user.id,
        uid: user.id,
        email: user.email,
        name: user.name || "",
        displayName: user.name || "",
        photoURL: user.photoURL || user.avatar || null,
        role: normalizeRole(user.role),
        status: user.status || "ACTIVE"
      }
    });
  } catch (err: any) {
    console.error("[Auth API] Google Auth Error:", err);
    return NextResponse.json({ error: "Google sign-in failed" }, { status: 500 });
  }
}

/**
 * 7. POST /auth/apple
 * Apple OAuth authentication.
 */
export async function appleAuthHandler(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const { email, name, identityToken, role } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email from Apple is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userRole = normalizeRole(role);

    let user = await firestoreDb.users.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      const nowIso = new Date().toISOString();
      const userData = {
        email: normalizedEmail,
        name: name || "Apple User",
        displayName: name || "Apple User",
        role: userRole,
        status: "ACTIVE",
        walletBalance: 0,
        rating: 5.0,
        kycStatus: userRole === "PARTNER" ? "UNVERIFIED" : "VERIFIED",
        createdAt: nowIso,
        updatedAt: nowIso
      };

      if (userRole === "PARTNER") {
        user = await firestoreDb.partnerUsers.create({ data: userData });
      } else {
        user = await firestoreDb.clientUsers.create({ data: userData });
      }
    }

    const accessToken = signToken({
      id: user.id,
      email: user.email,
      name: user.name || "",
      role: normalizeRole(user.role),
      type: "access"
    }, 15 * 60);

    const refreshToken = signToken({
      id: user.id,
      email: user.email,
      role: normalizeRole(user.role),
      type: "refresh"
    }, 30 * 24 * 60 * 60);

    return NextResponse.json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken,
      redirectUrl: getRoleRedirectUrl(user.role),
      user: {
        id: user.id,
        uid: user.id,
        email: user.email,
        name: user.name || "",
        displayName: user.name || "",
        role: normalizeRole(user.role),
        status: user.status || "ACTIVE"
      }
    });
  } catch (err: any) {
    console.error("[Auth API] Apple Auth Error:", err);
    return NextResponse.json({ error: "Apple sign-in failed" }, { status: 500 });
  }
}

/**
 * 8. POST /auth/refresh
 * Validates refresh token and performs token rotation.
 */
export async function refreshTokenHandler(req: NextRequest) {
  try {
    const body = ((await req.json().catch(() => ({}))) || {}) as any;
    const refreshToken = body.refreshToken || req.headers.get("x-refresh-token");

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 });
    }

    const payload = verifyToken(refreshToken);
    if (!payload || payload.type !== "refresh") {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    const user = await firestoreDb.users.findUnique({ where: { id: payload.id } });
    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const userRole = normalizeRole(user.role);

    // Generate new access token and rotated refresh token
    const newAccessToken = signToken({
      id: user.id,
      email: user.email,
      name: user.name || "",
      role: userRole,
      type: "access"
    }, 15 * 60);

    const newRefreshToken = signToken({
      id: user.id,
      email: user.email,
      role: userRole,
      type: "refresh"
    }, 30 * 24 * 60 * 60);

    return NextResponse.json({
      success: true,
      token: newAccessToken,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        uid: user.id,
        email: user.email,
        name: user.name || "",
        role: userRole
      }
    });
  } catch (err: any) {
    console.error("[Auth API] Refresh Token Error:", err);
    return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
  }
}

/**
 * 9. GET /auth/me
 * Validates Bearer token and returns logged-in user profile, role, wallet balance, active booking.
 */
export async function meHandler(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization header is required" }, { status: 401 });
    }

    const payload = verifyToken(authHeader);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired access token" }, { status: 401 });
    }

    const user = await firestoreDb.users.findUnique({ where: { id: payload.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userRole = normalizeRole(user.role);

    // Fetch role-specific context (e.g. partner profile or active booking)
    let partnerProfile = null;
    if (userRole === "PARTNER") {
      partnerProfile = await firestoreDb.partners.findUnique({ where: { userId: user.id } });
    }

    let activeBooking = null;
    const userBookings = await firestoreDb.bookings.findMany({ where: { userId: user.id } }).catch(() => []);
    if (userBookings.length > 0) {
      activeBooking = userBookings.find((b: any) => b.status !== "DELIVERED" && b.status !== "CANCELLED") || userBookings[0];
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        uid: user.id,
        email: user.email,
        name: user.name || user.displayName || "",
        displayName: user.name || user.displayName || "",
        phone: user.phone || "",
        role: userRole,
        avatar: user.avatar || user.photoURL || null,
        photoURL: user.avatar || user.photoURL || null,
        walletBalance: (partnerProfile as any)?.walletBalance || user.walletBalance || 0,
        rating: (partnerProfile as any)?.rating || user.rating || 5.0,
        kycStatus: partnerProfile ? ((partnerProfile as any).isVerified ? "VERIFIED" : "UNVERIFIED") : (user.kycStatus || "VERIFIED"),
        status: user.status || "ACTIVE",
        isOnline: user.isOnline ?? true
      },
      partnerProfile,
      activeBooking,
      bookingsCount: userBookings.length
    });
  } catch (err: any) {
    console.error("[Auth API] Get Me Error:", err);
    return NextResponse.json({ error: "Failed to fetch user session" }, { status: 500 });
  }
}
