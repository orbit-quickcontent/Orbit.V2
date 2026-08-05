import { NextRequest, NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";
import { signToken, normalizeRole } from "@/lib/security-auth";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find the latest active OTP for this email
    const record = await firestoreDb.emailOtps.findFirst({
      where: { email: normalizedEmail, used: false, verified: false }
    });

    if (!record) {
      return NextResponse.json(
        { error: "No active verification code found. Please request a new one." },
        { status: 404 }
      );
    }

    // Check expiry
    if (new Date(record.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Verify OTP matches
    if (record.otp !== otp.toString()) {
      const newAttempts = (record.attempts || 0) + 1;

      if (newAttempts >= 5) {
        // If max attempts reached, mark as used/expired
        await firestoreDb.emailOtps.update({
          where: { id: record.id },
          data: { used: true, attempts: newAttempts }
        });
        return NextResponse.json(
          { error: "Too many failed attempts. This code has been invalidated." },
          { status: 401 }
        );
      } else {
        await firestoreDb.emailOtps.update({
          where: { id: record.id },
          data: { attempts: newAttempts }
        });
        return NextResponse.json(
          { error: `Invalid code. ${5 - newAttempts} attempts remaining.` },
          { status: 401 }
        );
      }
    }

    // Success: Mark as verified and used
    await firestoreDb.emailOtps.update({
      where: { id: record.id },
      data: { verified: true, used: true }
    });

    // Look up the user in client_users then partner_users.
    // The mobile apps expect { token, user } — not just { success, message }.
    let user: any =
      (await firestoreDb.clientUsers.findUnique({ where: { email: normalizedEmail } })) ||
      (await firestoreDb.partnerUsers.findUnique({ where: { email: normalizedEmail } }));

    if (!user) {
      // First-time OTP sign-in: create a CLIENT user automatically.
      const nowIso = new Date().toISOString();
      user = await firestoreDb.clientUsers.create({
        data: {
          email: normalizedEmail,
          name: normalizedEmail.split("@")[0],
          role: "CLIENT",
          status: "ACTIVE",
          walletBalance: 0,
          rating: 5.0,
          kycStatus: "VERIFIED",
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      });
    }

    const userRole = normalizeRole(user.role);

    const token = signToken(
      {
        id: user.id,
        email: user.email,
        name: user.name || "",
        role: userRole,
        type: "access",
      },
      15 * 60
    );

    const refreshToken = signToken(
      {
        id: user.id,
        email: user.email,
        role: userRole,
        type: "refresh",
      },
      30 * 24 * 60 * 60
    );

    return NextResponse.json({
      success: true,
      token,
      accessToken: token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || "",
        phone: user.phone || null,
        role: userRole,
        brandLogo: user.brandLogo || null,
        brandFont: user.brandFont || null,
        brandColor: user.brandColor || null,
        editorRequirements: user.editorRequirements || null,
        avatar: user.avatar || null,
      },
    });
  } catch (err: any) {
    console.error("[Verify OTP API] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
