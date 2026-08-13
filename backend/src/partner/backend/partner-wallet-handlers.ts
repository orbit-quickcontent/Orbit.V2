/**
 * Partner Backend | Partner Wallet Handlers
 *
 * Calls the authoritative wallet service:
 * - Detailed financial breakdown (availableBalance, pendingPayout, completedEarnings, totalEarned, totalWithdrawn)
 * - Atomic and idempotent withdrawal processing
 */

import { NextRequest, NextResponse } from "next/server";
import { getPartnerWalletSummary, processPartnerWithdrawal } from "@/services/wallet.service";
import { verifyToken } from "@/lib/security-auth";

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

    const summary = await getPartnerWalletSummary(partnerId);

    return NextResponse.json({
      success: true,
      balance: summary.availableBalance,
      availableBalance: summary.availableBalance,
      pendingPayout: summary.pendingPayout,
      pendingClearance: summary.pendingPayout,
      completedEarnings: summary.completedEarnings,
      totalEarned: summary.totalEarned,
      totalWithdrawn: summary.totalWithdrawn,
      bankVerified: summary.kycStatus === "VERIFIED",
      bankName: summary.bankAccount?.bankName || "Linked Bank",
      bankAccount: summary.bankAccount,
      transactions: [...summary.earningHistory, ...summary.withdrawalHistory],
      earningHistory: summary.earningHistory,
      withdrawalHistory: summary.withdrawalHistory,
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
    const body = (await request.json()) as any;
    const amount = Number(body.amount);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valid withdrawal amount is required" }, { status: 400 });
    }

    // Extract authenticated actor
    let actorId = partnerId;
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token) {
      const payload = verifyToken(token);
      if (payload?.id) actorId = payload.id;
    }

    const idempotencyKey = request.headers.get("idempotency-key") || body.idempotencyKey;

    const withdrawResult = await processPartnerWithdrawal({
      partnerId,
      amount,
      idempotencyKey: idempotencyKey || undefined,
      actorId,
    });

    if (!withdrawResult.success) {
      return NextResponse.json(
        { error: withdrawResult.error?.message || "Withdrawal failed", code: withdrawResult.error?.code },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed withdrawal of ₹${amount}.`,
      transactionId: withdrawResult.transactionId,
      newBalance: withdrawResult.newBalance,
      amountWithdrawn: withdrawResult.amountWithdrawn,
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 });
  }
}
