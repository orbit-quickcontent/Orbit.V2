import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '../../services/db.service';
import { validateBody, bookingSchema } from '../../lib/validation';
import { verifyToken } from '../../lib/security-auth';
import { logAudit } from '../../lib/auth-server';

function parseBookingDate(raw: string): string {
  if (!raw) return new Date().toISOString();
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  const lower = raw.toLowerCase();
  const now = new Date();
  if (lower.startsWith('tomorrow')) now.setDate(now.getDate() + 1);
  return now.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json() as Record<string, unknown>;
    let userId = raw.userId?.toString();
    if (!userId) {
      const header = request.headers.get('authorization') ?? '';
      const token = header.replace(/^Bearer\s+/i, '').trim();
      const payload = token ? verifyToken(token) : null;
      userId = payload?.id?.toString();
    }
    if (!userId) return NextResponse.json({ error: 'Authenticated client required' }, { status: 401 });

    const body = { ...raw, userId, bookingDate: parseBookingDate(raw.bookingDate?.toString() ?? '') };
    const validation = validateBody(bookingSchema, body);
    if (!validation.success) return NextResponse.json({ error: 'Validation failed', details: (validation as any).errors }, { status: 400 });

    const data = (validation as any).data;
    const pkg = await dbClient.package.findUnique({ where: { id: data.packageId } });
    if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });

    const user = await dbClient.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'Client account not found' }, { status: 404 });

    const booking = await dbClient.booking.create({
      data: {
        userId,
        packageId: data.packageId,
        bookingDate: new Date(data.bookingDate),
        timeSlot: data.timeSlot,
        location: data.location ?? null,
        notes: data.notes ?? null,
        latitude: data.lat != null ? Number(data.lat) : null,
        longitude: data.lng != null ? Number(data.lng) : null,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        syncPercentage: 0,
      },
      include: { package: true, partner: true },
    });

    await logAudit({ userId, action: 'CREATE_BOOKING', entity: 'Booking', entityId: booking.id, details: { packageId: data.packageId, bookingDate: data.bookingDate, timeSlot: data.timeSlot }, req: request });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('[BOOKING CREATE]', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
