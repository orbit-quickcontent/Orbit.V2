/**
 * Partner Backend | Partner Wallet Handlers
 *
 * GET  — Get partner wallet details using Firestore (balance, pending, withdrawn, recent transactions)
 * POST — Partner withdrawal request with atomic balance deduction and manual approval gate
 *
 * Category: Partner Backend
 */

import { firestoreDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, withdrawSchema } from "@/lib/validation";
import { logAudit } from "@/lib/auth-server";

// GET /api/partners/[id]/wallet — Get partner wallet details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnerId } = await params;

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID is required" }, { status: 400 });
    }

    const partner = await firestoreDb.partners.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Get recent transactions (last 50)
    const transactions = await firestoreDb.transactions.findMany({
      where: { partnerId },
    });

    // Sort by createdAt desc in-memory
    transactions.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const totalEarnedFromTx = transactions
      .filter((t) => (t.type === "PAYOUT" || t.type === "EARNING") && (t.status === "COMPLETED" || t.status === "PAID" || !t.status))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalWithdrawnFromTx = transactions
      .filter((t) => t.type === "WITHDRAWAL" && (t.status === "COMPLETED" || t.status === "PAID"))
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

    const balance = partner.walletBalance != null ? Math.max(0, partner.walletBalance) : Math.max(0, totalEarnedFromTx - totalWithdrawnFromTx);
    const totalWithdrawn = partner.totalWithdrawn != null ? partner.totalWithdrawn : totalWithdrawnFromTx;
    const recentTransactions = transactions.slice(0, 50);

    const maskedAccount = partner.accountNumberMasked
      ? partner.accountNumberMasked
      : partner.accountNumber
      ? `****${partner.accountNumber.slice(-4)}`
      : partner.encryptedAccountNumber
      ? "****"
      : null;

    return NextResponse.json({
      balance,
      pendingClearance: partner.pendingClearance || 0,
      totalWithdrawn,
      totalEarned: totalEarnedFromTx,
      bankVerified: partner.verificationStatus === "VERIFIED" || partner.isVerified === true,
      bankName: partner.bankName || "Linked Bank",
      accountNumberMasked: maskedAccount,
      transactions: recentTransactions,
    });
  } catch (error) {
    console.error("Error fetching wallet details:", error);
    return NextResponse.json({ error: "Failed to fetch wallet details" }, { status: 500 });
  }
}

// POST /api/partners/[id]/withdraw — Partner withdrawal (Idempotent & Transactional)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnerId } = await params;
    const body = await request.json();

    const validation = validateBody(withdrawSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: (validation as any).errors },
        { status: 400 }
      );
    }

    const { amount } = (validation as any).data;

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Withdrawal amount must be a positive number" }, { status: 400 });
    }

    const partner = await firestoreDb.partners.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Verify bank account is linked & verified
    const isVerified = partner.verificationStatus === "VERIFIED" || partner.isVerified === true;
    if (!isVerified || (!partner.encryptedAccountNumber && !partner.accountNumber)) {
      return NextResponse.json(
        { error: "Bank account must be linked and verified before withdrawal" },
        { status: 400 }
      );
    }

    // Atomic balance check & deduction using optimistic check
    const currentBalance = partner.walletBalance || 0;
    if (currentBalance < amount) {
      return NextResponse.json(
        { error: `Insufficient wallet balance. Current balance: ₹${currentBalance}` },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - amount;
    const newTotalWithdrawn = (partner.totalWithdrawn || 0) + amount;

    // Atomic update
    const updatedPartner = await firestoreDb.partners.update({
      where: { id: partnerId },
      data: {
        walletBalance: newBalance,
        totalWithdrawn: newTotalWithdrawn,
      },
    });

    const nowIso = new Date().toISOString();
    const maskedAcc = partner.accountNumber
      ? `****${partner.accountNumber.slice(-4)}`
      : "Linked Account";

    // Create Transaction ledger entry with PENDING_APPROVAL status (Manual Approval Gate)
    const transaction = await firestoreDb.transactions.create({
      data: {
        partnerId,
        type: "WITHDRAWAL",
        amount: -amount,
        status: "PENDING_APPROVAL",
        bankName: partner.bankName || "Linked Bank",
        description: `Withdrawal request of ₹${amount} to ${partner.bankName || "bank"} account ${maskedAcc}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    });

    // Record audit trail
    await logAudit({
      userId: partner.userId,
      action: "WALLET_WITHDRAW_REQUESTED",
      entity: "Transaction",
      entityId: transaction.id,
      details: { amount, partnerId, status: "PENDING_APPROVAL" },
      req: request,
    });

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted for approval",
      transactionId: transaction.id,
      status: "PENDING_APPROVAL",
      newBalance: updatedPartner.walletBalance,
      withdrawnAmount: amount,
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 });
  }
}
