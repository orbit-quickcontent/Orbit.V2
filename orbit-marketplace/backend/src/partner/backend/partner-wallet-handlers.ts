/**
 * Partner Backend | Partner Wallet Handlers
 *
 * GET  — Get partner wallet details using Firestore (balance, pending, withdrawn, recent transactions)
 * POST — Partner withdrawal request
 *
 * Re-exported by: src/app/api/partners/[id]/wallet/route.ts (GET)
 *                src/app/api/partners/[id]/withdraw/route.ts (POST)
 * Category: Partner Backend
 */

import { firestoreDb } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { validateBody, withdrawSchema } from '@/lib/validation'
import { logAudit } from '@/lib/auth-server'

// GET /api/partners/[id]/wallet — Get partner wallet details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnerId } = await params

    const partner = await firestoreDb.partners.findUnique({
      where: { id: partnerId },
    })

    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Get recent transactions (last 20)
    const transactions = await firestoreDb.transactions.findMany({
      where: { partnerId },
    })

    // Sort by createdAt desc in-memory
    transactions.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const recentTransactions = transactions.slice(0, 20);

    return NextResponse.json({
      balance: partner.walletBalance,
      pendingClearance: partner.pendingClearance,
      totalWithdrawn: partner.totalWithdrawn,
      bankVerified: partner.bankVerified,
      bankName: partner.bankName,
      accountNumberMasked: partner.accountNumber
        ? `****${partner.accountNumber.slice(-4)}`
        : null,
      transactions: recentTransactions,
    })
  } catch (error) {
    console.error('Error fetching wallet details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet details' },
      { status: 500 }
    )
  }
}

// POST /api/partners/[id]/withdraw — Partner withdrawal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnerId } = await params
    const body = await request.json()

    const validation = validateBody(withdrawSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: (validation as any).errors },
        { status: 400 }
      );
    }

    const { amount } = (validation as any).data;

    const partner = await firestoreDb.partners.findUnique({
      where: { id: partnerId },
    })

    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Verify bank account is linked and verified
    if (partner.verificationStatus !== "VERIFIED" || !partner.encryptedAccountNumber) {
      return NextResponse.json(
        { error: 'Bank account must be linked and verified before withdrawal' },
        { status: 400 }
      )
    }

    // Verify sufficient balance
    if (partner.walletBalance < amount) {
      return NextResponse.json(
        { error: `Insufficient balance. Current balance: ₹${partner.walletBalance}` },
        { status: 400 }
      )
    }

    // Deduct from walletBalance, add to totalWithdrawn
    const updatedPartner = await firestoreDb.partners.update({
      where: { id: partnerId },
      data: {
        walletBalance: partner.walletBalance - amount,
        totalWithdrawn: partner.totalWithdrawn + amount,
      },
    })

    // Create Transaction record
    const transaction = await firestoreDb.transactions.create({
      data: {
        partnerId,
        type: 'WITHDRAWAL',
        amount: -amount,
        status: 'COMPLETED',
        description: `Withdrawal of ₹${amount} to ${partner.bankName} account ****${partner.accountNumber.slice(-4)}`,
      },
    })

    // 2. Log audit event
    await logAudit({
      userId: partner.userId,
      action: "WALLET_WITHDRAW",
      entity: "Transaction",
      entityId: transaction.id,
      details: { amount, partnerId },
      req: request,
    });

    return NextResponse.json({
      success: true,
      newBalance: updatedPartner.walletBalance,
      withdrawnAmount: amount,
    })
  } catch (error) {
    console.error('Error processing withdrawal:', error)
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    )
  }
}
