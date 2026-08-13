import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '../../../services/db.service';
import { createRazorpayOrder } from '../../../services/payment.service';
import { verifyToken } from '../../../lib/security-auth';
import { acquireBookingLock } from '../../../services/redis.service';
import { ensurePartnerEarningSnapshot } from '../../../services/partner-earnings.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { bookingId?: string };
    if (!body.bookingId) return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });

    const rawToken = request.headers.get('authorization') || '';
    const token = rawToken.replace(/^Bearer\s+/i, '').trim();
    const session = token ? verifyToken(token) : null;
    if (!session || session.type !== 'access' || session.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Authenticated client required' }, { status: 401 });
    }

    const locked = await acquireBookingLock(`payment:${body.bookingId}`, session.id);
    if (!locked) return NextResponse.json({ error: 'Payment request already in progress' }, { status: 409 });

    const booking = await dbClient.booking.findUnique({
      where: { id: body.bookingId },
      include: { package: true },
    });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.userId !== session.id) return NextResponse.json({ error: 'Booking access denied' }, { status: 403 });
    if (booking.status !== 'PENDING') return NextResponse.json({ error: `Payment cannot start from ${booking.status}` }, { status: 409 });
    if (!booking.package) return NextResponse.json({ error: 'Booking package not found' }, { status: 404 });

    // Snapshot the exact Partner earning before payment/dispatch so the offer
    // amount cannot drift after the client has paid.
    const economics = await ensurePartnerEarningSnapshot(booking.id);

    if (booking.paymentStatus === 'PROCESSING' && booking.paymentId) {
      return NextResponse.json({
        orderId: booking.paymentId,
        amount: booking.package.price * 100,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        bookingId: booking.id,
        partnerEarningAmount: economics.partnerEarningAmount,
      });
    }

    if (booking.paymentStatus === 'SUCCESS') {
      return NextResponse.json({ error: 'Booking already paid', paymentId: booking.paymentId }, { status: 409 });
    }

    const order = await createRazorpayOrder({
      amountInPaise: booking.package.price * 100,
      receipt: `orbit_${booking.id}`,
      notes: { bookingId: booking.id, userId: booking.userId, partnerEarningAmount: String(economics.partnerEarningAmount) },
    });

    const updated = await dbClient.booking.updateMany({
      where: {
        id: booking.id,
        userId: session.id,
        status: 'PENDING',
        paymentStatus: { not: 'SUCCESS' },
      },
      data: { paymentStatus: 'PROCESSING', paymentMethod: 'razorpay', paymentId: order.id },
    });

    if (updated.count !== 1) {
      return NextResponse.json({ error: 'Booking changed before payment order could be saved' }, { status: 409 });
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      bookingId: booking.id,
      partnerEarningAmount: economics.partnerEarningAmount,
    });
  } catch (error) {
    console.error('[Payment] order creation failed:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
