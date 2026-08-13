import { NextRequest, NextResponse } from 'next/server';
import { processPaymentWebhook } from '../../../services/payment.service';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const result = await processPaymentWebhook(rawBody);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Webhook processing failed' }, { status: 500 });
  }
}
