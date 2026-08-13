import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '../../../services/db.service';
import { createRazorpayOrder } from '../../../services/payment.service';

export async function POST(request: NextRequest) {
  const body = await request.json() as { bookingId?: string };
  if (!body.bookingId) return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });

  const booking = await dbClient.booking.findUnique({ where: { id: body.bookingId } });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.status !== 'PENDING') return NextResponse.json({ error: `Payment cannot start from ${booking.status}` }, { status: 409 });
  if (booking.paymentStatus === 'SUCCESS') return NextResponse.json({ error: 'Booking already paid', paymentId: booking.paymentId }, { status: 409 });

  const amount = booking.packageId ? await dbClient.package.findUnique({ where: { id: booking.packageId } }) : null;
  if (!amount) return NextResponse.json({ error: 'Booking package not found' }, { status: 404 });

  const order = await createRazorpayOrder({
    amountInPaise: amount.price * 100,
    receipt: `orbit_${booking.id}`,
    notes: { bookingId: booking.id, userId: booking.userId },
  });

  await dbClient.booking.update({
    where: { id: booking.id },
    data: { paymentStatus: 'PROCESSING', paymentMethod: 'razorpay', paymentId: order.id },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    bookingId: booking.id,
  });
}
