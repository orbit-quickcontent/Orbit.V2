/**
 * Shared Backend | Send OTP Handler
 *
 * Generates a 6-digit OTP and stores it in-memory for verification.
 * Sends the OTP via Nodemailer SMTP if credentials are provided in env.
 * Otherwise, falls back to Ethereal Email and prints the preview link / OTP to console.
 *
 * Used by: /api/auth/send-otp route
 * Category: Shared Backend - Auth
 */

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { firestoreDb } from "@/lib/db";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Nodemailer transport setup
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS;
const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
const smtpFrom = process.env.SMTP_FROM || smtpUser || '"Orbit" <noreply@orbit.com>';

let transporter: any = null;

if (smtpUser && smtpPass) {
  if (process.env.GMAIL_USER) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }
}

async function sendEmailViaGmailApi(to: string, subject: string, text: string, html: string): Promise<boolean> {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const gmailUser = process.env.GMAIL_USER;
  const redirectUri = process.env.GMAIL_REDIRECT_URI || "https://developers.google.com/oauthplayground";

  if (!clientId || !clientSecret || !refreshToken || !gmailUser) {
    console.log("[Gmail API] Credentials not fully configured. Bypassing Gmail API.");
    return false;
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
    const messageParts = [
      `From: ${gmailUser}`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      html,
    ];
    const message = messageParts.join("\n");

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(`[Gmail API] Email successfully sent to ${to} via Gmail API`);
    return true;
  } catch (err) {
    console.error("[Gmail API] Error sending email via Gmail API:", err);
    return false;
  }
}

async function sendOtpEmail(to: string, otp: string): Promise<{ success: boolean; isDemo: boolean; previewUrl?: string }> {
  const subject = "Your Orbit Verification Code";
  const text = `Your Orbit verification code is: ${otp}. This code is valid for 5 minutes.`;
  const html = `
    <div style="background-color: #0b0b0f; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1f1f2e; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 28px; font-weight: 900; letter-spacing: -0.05em; color: #00f0ff; margin: 0;">ORBIT</h2>
      </div>
      <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 16px; color: #ffffff;">Verify Your Email</h1>
      <p style="font-size: 15px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
        Use the verification code below to complete your registration on Orbit. This code is valid for 5 minutes.
      </p>
      <div style="background-color: rgba(0, 240, 255, 0.08); border: 1px solid rgba(0, 240, 255, 0.25); padding: 18px 30px; border-radius: 8px; display: inline-block; margin-bottom: 24px;">
        <span style="font-size: 36px; font-weight: 900; letter-spacing: 0.1em; color: #00f0ff;">${otp}</span>
      </div>
      <p style="font-size: 12px; color: #52525b; line-height: 1.5; margin-top: 32px;">
        If you did not request this code, you can safely ignore this email.
        <br />
        &copy; 2026 Orbit. Professional Cinema. Delivered in 60 Minutes.
      </p>
    </div>
  `;

  // 1. Try Brevo API first
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sender: { name: "Orbit", email: "orbit.quickcontent@gmail.com" },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html
        })
      });
      if (res.ok) {
        console.log(`[Brevo API] Email successfully sent to ${to}`);
        return { success: true, isDemo: false };
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("[Brevo API] Failed to send email:", errorData);
      }
    } catch (err) {
      console.error("[Brevo API] Error sending email via Brevo:", err);
    }
  }

  // 2. Try Gmail API second
  const gmailSent = await sendEmailViaGmailApi(to, subject, text, html);
  if (gmailSent) {
    return { success: true, isDemo: false };
  }

  // 2. Try Nodemailer SMTP fallback
  if (transporter) {
    try {
      await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        text,
        html,
      });
      console.log(`[OTP] Email successfully sent to ${to} via SMTP`);
      return { success: true, isDemo: false };
    } catch (err) {
      console.error("[OTP] Error sending SMTP email:", err);
    }
  }

  // 3. Try Ethereal Email fallback
  try {
    const testAccount = await nodemailer.createTestAccount();
    const etherealTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await etherealTransporter.sendMail({
      from: '"Orbit" <noreply@orbit.com>',
      to,
      subject,
      text,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    console.log(`[OTP-Fallback] Ethereal email sent to ${to}`);
    console.log(`[OTP-Fallback] Preview URL: ${previewUrl}`);
    return { success: true, isDemo: true, previewUrl };
  } catch (err) {
    console.error("[OTP-Fallback] Ethereal email fallback failed:", err);
    return { success: false, isDemo: true };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Query the latest active OTP for this email from Firestore
    const existing = await firestoreDb.emailOtps.findFirst({
      where: { email: normalizedEmail, used: false, verified: false }
    });

    if (existing && process.env.NODE_ENV !== "development") {
      // 1. Rate limit: 1 request per minute (60 seconds)
      const lastRequested = new Date(existing.createdAt).getTime();
      if (Date.now() - lastRequested < 60 * 1000) {
        const waitSeconds = Math.ceil((60 * 1000 - (Date.now() - lastRequested)) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSeconds}s before requesting a new code.` },
          { status: 429 }
        );
      }

      // 2. Limit: max 5 requests per hour (we can check document attempts)
      if (existing.attempts >= 5 && new Date(existing.expiresAt).getTime() > Date.now()) {
        const waitMinutes = Math.ceil((new Date(existing.expiresAt).getTime() - Date.now()) / (60 * 1000));
        return NextResponse.json(
          { error: `Too many verification requests. Please try again in ${waitMinutes}m.` },
          { status: 429 }
        );
      }
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes validity

    // Save OTP to Firestore
    await firestoreDb.emailOtps.create({
      data: {
        email: normalizedEmail,
        otp: otp,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt,
        verified: false,
        attempts: (existing?.attempts || 0) + 1,
        used: false,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent") || "N/A"
      }
    });

    console.log(`[OTP] Generated & Saved in Firestore: ${normalizedEmail} → ${otp}`);

    // Send the email
    const emailResult = await sendOtpEmail(normalizedEmail, otp);

    const responsePayload: Record<string, any> = {
      success: true,
      message: "OTP sent successfully",
    };

    if (process.env.NODE_ENV === "development") {
      responsePayload.devOtp = otp;
    }

    if (emailResult.isDemo && emailResult.previewUrl) {
      responsePayload.previewUrl = emailResult.previewUrl;
    }

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error("[OTP API] Internal Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
