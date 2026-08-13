/**
 * Partner wallet + earnings contract.
 * UI remains unchanged; this endpoint supplies live balance, pending jobs,
 * completed earnings, and withdrawal history to the existing Partner App.
 */
import { firestoreDb } from "@/lib/db";
import { dbClient } from "@/services/db.service";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, withdrawSchema } from "@/lib/validation";
import { logAudit } from "@/lib/auth-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnerId } = await params;
    if (!partnerId) return NextResponse.json({ error: "Partner ID is required" }, { status: 400 });

    const partner = await dbClient.partner.findUnique({ where: { id: partnerId } });
    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    const [transactions, earnings] = await Promise.all([
      firestoreDb.transactions.findMany({ where: { partnerId } }),
      dbClient.partnerEarning.findMany({
        where: { partnerId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    transactions.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const availableEarnings = earnings
      .filter((e) => e.status === "AVAILABLE" || e.status === "PAID")
      .reduce((sum, e) => sum + e.partnerEarningAmount, 0);
    const pendingPayout = earnings
      .filter((e) => e.status === "PENDING")
      .reduce((sum, e) => sum + e.partnerEarningAmount, 0);
    const completedEarnings = earnings
      .filter((e) => e.status === "AVAILABLE" || e.status === "PAID")
      .reduce((sum, e) => sum + e.partnerEarningAmount, 0);
    const totalWithdrawn = partner.totalWithdrawn || transactions
      .filter((t) => t.type === "WITHDRAWAL" && (t.status === "COMPLETED" || t.status === "PAID"))
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

    return NextResponse.json({
      balance: partner.walletBalance || 0,
      availableEarnings,
      pendingPayout,
      completedEarnings,
      pendingClearance: partner.pendingClearance || 0,
      totalWithdrawn,
      totalEarned: earnings.reduce((sum, e) => sum + e.partnerEarningAmount, 0),
      bankVerified: partner.verificationStatus === "VERIFIED" || partner.isVerified === true,
      bankName: partner.bankName || "Linked Bank",
      accountNumberMasked: partner.encryptedAccountNumber ? "****" : null,
      earnings: earnings.slice(0, 100),
      transactions: transactions.slice(0, 50),
    });
  } catch (error) {
    console.error("Error fetching wallet details:", error);
    return NextResponse.json({ error: "Failed to fetch wallet details" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnerId } = await params;
    const body = await request.json();
    const validation = validateBody(withdrawSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: (validation as any).errors }, { status: 400 });
    }

    const { amount } = (validation as any).data;
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Withdrawal amount must be a positive number" }, { status: 400 });
    }

    const partner = await dbClient.partner.findUnique({ where: { id: partnerId } });
    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    const isVerified = partner.verificationStatus === "VERIFIED" || partner.isVerified === true;
    if (!isVerified || !partner.encryptedAccountNumber) {
      return NextResponse.json({ error: "Bank account must be linked and verified before withdrawal" }, { status: 400 });
    }

    const currentBalance = partner.walletBalance || 0;
    if (currentBalance < amount) {
      return NextResponse.json({ error: `Insufficient wallet balance. Current balance: ₹${currentBalance}` }, { status: 400 });
    }

    const updatedPartner = await dbClient.$transaction(async (tx) => {
      const current = await tx.partner.findUnique({ where: { id: partnerId } });
      if (!current || (current.walletBalance || 0) < amount) throw new Error("Insufficient wallet balance");

      const next = await tx.partner.update({
        where: { id: partnerId },
        data: {
          walletBalance: { decrement: amount },
          totalWithdrawn: { increment: amount },
        },
      });

      await tx.transaction.create({
        data: {
          partnerId,
          type: "WITHDRAWAL",
          amount: -amount,
          status: "PENDING_APPROVAL",
          description: `Withdrawal request of ₹${amount}`,
        },
      });

      return next;
    });

    await logAudit({
      userId: partner.userId,
      action: "WALLET_WITHDRAW_REQUESTED",
      entity: "Transaction",
      entityId: partnerId,
      details: { amount, partnerId, status: "PENDING_APPROVAL" },
      req: request,
    });

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted for approval",
      status: "PENDING_APPROVAL",
      newBalance: updatedPartner.walletBalance,
      withdrawnAmount: amount,
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json({ error: (error as Error).message || "Failed to process withdrawal" }, { status: 500 });
  }
}
