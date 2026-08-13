import { firestoreDb } from '@/lib/db';
import { dbClient } from '@/services/db.service';
import { acquireBookingLock } from '@/services/redis.service';
import { verifyToken } from '@/lib/security-auth';
import { NextRequest, NextResponse } from 'next/server';
import { attachPartnerEarningSnapshot } from '@/services/partner-earnings.service';
import { notifyAccept, notifyClient } from '@/services/websocket.service';

interface AcceptBody { partnerId?: string }

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    const body = (await request.json()) as AcceptBody;
    const partnerId = body.partnerId;
    if (!partnerId) return NextResponse.json({ error: 'partnerId is required' }, { status: 400 });

    const token = request.headers.get('authorization') || '';
    const payload = verifyToken(token);
    if (!payload || payload.type !== 'access') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const partner = await dbClient.partner.findUnique({ where: { id: partnerId } });
    if (!partner) return NextResponse.json({ error: 'Partner profile not found' }, { status: 404 });
    if (payload.role === 'PARTNER' && partner.userId !== payload.id) return NextResponse.json({ error: 'Cannot accept for another partner' }, { status: 403 });
    if (process.env.NODE_ENV !== 'development' && partner.verificationStatus !== 'VERIFIED') {
      return NextResponse.json({ error: 'Partner verification is required before accepting jobs' }, { status: 403 });
    }

    const locked = await acquireBookingLock(bookingId, partnerId);
    if (!locked) return NextResponse.json({ error: 'Booking is already being claimed' }, { status: 409 });

    const result = await dbClient.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking) throw new Error('Booking not found');
      if (booking.status !== 'DISPATCHED') throw new Error(`Booking is not dispatched: ${booking.status}`);
      if (booking.partnerId) throw new Error('Booking already assigned');

      const dispatch = await tx.workDispatch.findFirst({ where: { bookingId, partnerId, status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
      if (!dispatch) throw new Error('No active dispatch offer exists for this partner');

      const claimed = await tx.booking.updateMany({
        where: { id: bookingId, status: 'DISPATCHED', partnerId: null },
        data: { partnerId, status: 'EN_ROUTE' },
      });
      if (claimed.count !== 1) throw new Error('Booking was claimed by another partner');

      await tx.partnerEarning.upsert({
        where: { bookingId },
        update: { partnerId },
        create: {
          bookingId,
          partnerId,
          grossAmount: booking.partnerEarningAmount + booking.platformCommissionAmount + booking.taxAmount + booking.editorPayoutAmount,
          platformCommissionAmount: booking.platformCommissionAmount,
          taxAmount: booking.taxAmount,
          editorPayoutAmount: booking.editorPayoutAmount,
          partnerEarningAmount: booking.partnerEarningAmount,
          status: 'PENDING',
        },
      });

      await tx.workDispatch.update({ where: { id: dispatch.id }, data: { status: 'ACCEPTED', respondedAt: new Date() } });
      await tx.workDispatch.updateMany({
        where: { bookingId, status: 'PENDING', id: { not: dispatch.id } },
        data: { status: 'EXPIRED', respondedAt: new Date() },
      });

      return tx.booking.findUnique({ where: { id: bookingId } });
    });

    const clientUser = result ? await firestoreDb.clientUsers.findUnique({ where: { id: result.userId } }) : null;
    const pkg = result ? await firestoreDb.packages.findUnique({ where: { id: result.packageId } }) : null;
    const partnerUser = await firestoreDb.partnerUsers.findUnique({ where: { id: partner.userId } });
    const resolvedPartner = { ...partner, user: partnerUser ? { id: partnerUser.id, name: partnerUser.name, phone: partnerUser.phone, avatar: partnerUser.avatar } : null };
    const updatedBooking = {
      ...result,
      user: clientUser ? { id: clientUser.id, name: clientUser.name, email: clientUser.email, phone: clientUser.phone } : null,
      package: pkg,
      partner: resolvedPartner,
    };

    notifyAccept({ bookingId, partnerId, partnerName: partnerUser?.name || 'A partner', booking: updatedBooking });
    notifyClient({ bookingId, event: 'booking:status-update', data: { bookingId, status: 'EN_ROUTE', previousStatus: 'DISPATCHED' } });

    return NextResponse.json({ booking: updatedBooking, partnerEarningAmount: result?.partnerEarningAmount ?? 0, earningStatus: 'PENDING' });
  } catch (error: any) {
    const status = /not found|No active|not dispatched|already assigned|claimed by another|already being claimed/.test(error?.message || '') ? 409 : 500;
    console.error('[Dispatch] accept failed:', error);
    return NextResponse.json({ error: error?.message || 'Failed to accept booking' }, { status });
  }
}
