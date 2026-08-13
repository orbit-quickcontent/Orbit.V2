import { NextRequest, NextResponse } from 'next/server';
import { createPaymentOrder } from '../../../services/payment.service';
import { verifyToken } from '../../../lib/security-auth';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { bookingId?: string; idempotencyKey?: string };
    if (!body.bookingId) return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });

    const rawToken = request.headers.get('authorization') || '';
    const token = rawToken.replace(/^Bearer\s+/i, '').trim();
    const session = token ? verifyToken(token) : null;
    if (!session || session.type !== 'access' || session.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Authenticated client required' }, { status: 401 });
    }

    const orderRes = await createPaymentOrder({
      bookingId: body.bookingId,
      clientId: session.id,
      idempotencyKey: body.idempotencyKey,
    });

    if (!orderRes.success) {
      return NextResponse.json({ error: orderRes.error?.message || 'Payment order creation failed' }, { status: 400 });
    }

    return NextResponse.json(orderRes);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Payment order creation failed' }, { status: 500 });
  }
}
