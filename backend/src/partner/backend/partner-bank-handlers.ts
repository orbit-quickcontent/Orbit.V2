import { NextRequest, NextResponse } from "next/server";
import { firestoreDb } from "../../lib/db";
import { getSessionUser } from "../../lib/auth-server";
import { encryptAccountNumber } from "../../services/security.service";
import { verifyBankAccount } from "../../services/payout.service";
import { logBankAudit } from "../../services/audit.service";
// (BookingStatus is not needed in this handler)

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== "PARTNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = sessionUser.id;

    // 2. Fetch partner profile
    const partner = await firestoreDb.partners.findUnique({
      where: { userId },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    // 3. Parse and validate body fields
    const { accountHolderName, accountNumber, ifsc, pan } = (await request.json()) as any;

    if (!accountHolderName?.trim() || !accountNumber?.trim() || !ifsc?.trim() || !pan?.trim()) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const cleanHolderName = accountHolderName.trim();
    const cleanAccountNumber = accountNumber.trim();
    const cleanIfsc = ifsc.trim().toUpperCase();
    const cleanPan = pan.trim().toUpperCase();

    // Max length validation to prevent overflow exploits
    if (cleanHolderName.length > 100 || cleanAccountNumber.length > 30 || cleanIfsc.length > 20 || cleanPan.length > 20) {
      return NextResponse.json({ error: "Input length exceeds safe limits" }, { status: 400 });
    }

    // Strict format matching patterns (Indian IFSC & PAN)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!ifscRegex.test(cleanIfsc)) {
      return NextResponse.json({ error: "Invalid IFSC code format (e.g. HDFC0001234)" }, { status: 400 });
    }

    if (!panRegex.test(cleanPan)) {
      return NextResponse.json({ error: "Invalid PAN format (e.g. ABCDE1234F)" }, { status: 400 });
    }

    // Log Bank Added/Change Action
    await logBankAudit({
      userId,
      partnerId: partner.id,
      action: "BANK_ADDED",
      details: { ifsc: cleanIfsc, pan: cleanPan },
      req: request,
    });

    // 4. Trigger Penny Drop Verification via payout.service
    const verificationResult = await verifyBankAccount(cleanHolderName, cleanAccountNumber, cleanIfsc, cleanPan);

    if (!verificationResult.success) {
      // Log verification failure to audits
      await logBankAudit({
        userId,
        partnerId: partner.id,
        action: "VERIFICATION_FAILURE",
        details: { reason: verificationResult.error || "Penny drop verification failed" },
        req: request,
      });

      // Update partner verification status in DB to block payouts
      await firestoreDb.partners.update({
        where: { id: partner.id },
        data: {
          verificationStatus: "FAILED",
          payoutEnabled: false,
          verifiedAt: null
        },
      });

      return NextResponse.json(
        { error: verificationResult.error || "Account Verification Failed. Check details and retry." },
        { status: 422 }
      );
    }

    // 5. Encrypt bank account number securely using AES-256
    const encryptedAccountNumber = encryptAccountNumber(cleanAccountNumber);

    // 6. Update Partner record with encrypted data and verification references
    await firestoreDb.partners.update({
      where: { id: partner.id },
      data: {
        accountHolderName: cleanHolderName,
        encryptedAccountNumber,
        accountNumber: null, // Clear plain text accountNumber if it exists
        ifscCode: cleanIfsc,
        bankName: verificationResult.bankName,
        branchName: verificationResult.branchName,
        panNumber: cleanPan,
        verificationStatus: "VERIFIED",
        verificationMethod: "PENNY_DROP",
        verificationReference: verificationResult.referenceId,
        verifiedAt: new Date(),
        payoutEnabled: true,
      },
    });

    // Log verification success to audits
    await logBankAudit({
      userId,
      partnerId: partner.id,
      action: "VERIFICATION_SUCCESS",
      details: { referenceId: verificationResult.referenceId, bankName: verificationResult.bankName },
      req: request,
    });

    return NextResponse.json({
      success: true,
      message: "Bank account linked and verified successfully",
      bankAccount: {
        bankName: verificationResult.bankName,
        ifscCode: cleanIfsc,
        accountHolderName: cleanHolderName,
        isVerified: true,
        verificationStatus: "VERIFIED"
      }
    });

  } catch (error) {
    console.error("[LinkBank Handler] Error linking partner bank account:", error);
    return NextResponse.json(
      { error: "Failed to link bank account. Please try again later." },
      { status: 500 }
    );
  }
}
