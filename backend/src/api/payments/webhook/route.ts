import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '../../../services/db.service';
import { verifyWebhookSignature } from '../../../services/payment.service';
import { notifyClient } from '../../../services/websocket.service';
import { dispatchBooking } from '../../../services/dispatch.service';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-razorpay-signature');
  const raw = await request.text();
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 401 });

  try {
    if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 503 });
  }

  const event = JSON.parse(raw) as any;
  if (event.event !== 'payment.captured' && event.event !== 'order.paid') {
    return NextResponse.json({ received: true });
  }

  const payment = event.payload?.payment?.entity;
  const order = event.payload?.order?.entity;
  const orderId = payment?.order_id || order?.id;
  const paymentId = payment?.id;
  if (!orderId || !paymentId) return NextResponse.json({ received: true });

  const booking = await dbClient.booking.findFirst({ where: { paymentId: orderId } });
  if (!booking) return NextResponse.json({ received: true });

  const updated = await dbClient.$transaction(async (tx) => {
    const current = await tx.booking.findUnique({ where: { id: booking.id } });
    if (!current || current.paymentStatus === 'SUCCESS') return current;
    if (!['PENDING', 'PROCESSING'].includes(current.paymentStatus)) return current;
    return tx.booking.update({
      where: { id: current.id },
      data: { paymentStatus: 'SUCCESS', paymentId, status: 'PAID' },
    });
  });

  if (updated) {
    notifyClient({ bookingId: updated.id, event: 'booking:payment-confirmed', data: { bookingId: updated.id, status: updated.status } });
    const lat = Number(updated.latitude);
    const lng = Number(updated.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      try { await dispatchBooking(updated.id, lat, lng); } catch (error) { console.warn('[Payment] dispatch after payment failed:', (error as Error).message); }
    }
  }

  return NextResponse.json({ received: true });
}
