import { NextRequest, NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";

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

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (err: any) {
    console.error("[Verify OTP API] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
