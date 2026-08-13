import crypto from 'crypto';

const razorpayBase = 'https://api.razorpay.com/v1';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function authHeader(): string {
  const key = requiredEnv('RAZORPAY_KEY_ID');
  const secret = requiredEnv('RAZORPAY_KEY_SECRET');
  return `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export async function createRazorpayOrder(input: {
  amountInPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const response = await fetch(`${razorpayBase}/orders`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: input.amountInPaise,
      currency: 'INR',
      receipt: input.receipt,
      payment_capture: 1,
      notes: input.notes || {},
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Razorpay order creation failed (${response.status}): ${body}`);
  }
  return response.json() as Promise<RazorpayOrder>;
}

function timingSafeHexEquals(expected: string, actual: string): boolean {
  if (!actual || expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(actual, 'utf8'));
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = requiredEnv('RAZORPAY_KEY_SECRET');
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return timingSafeHexEquals(expected, signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = requiredEnv('RAZORPAY_WEBHOOK_SECRET');
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return timingSafeHexEquals(expected, signature);
}
