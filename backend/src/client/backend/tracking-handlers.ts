import { firestoreDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUrl } from '@/lib/security';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Booking created',
  PAID: 'Payment verified',
  DISPATCHED: 'Finding your nearby partner',
  EN_ROUTE: 'Partner is on the way',
  SHOOTING: 'Shoot in progress',
  SYNCING: 'Footage syncing',
  EDITING: 'Editor is crafting your reel',
  DELIVERED: 'Your reel is ready',
  CANCELLED: 'Booking cancelled',
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  PENDING: 'Complete payment to start partner dispatch.',
  PAID: 'Payment verified. ORBIT is matching the nearest available partner.',
  DISPATCHED: 'A partner offer is active and awaiting acceptance.',
  EN_ROUTE: 'Your accepted partner is travelling to the shoot location.',
  SHOOTING: 'Your partner is capturing the creative brief.',
  SYNCING: 'Raw footage is being uploaded securely.',
  EDITING: 'Your reel is in the editing pipeline.',
  DELIVERED: 'The final reel is ready to open and share.',
  CANCELLED: 'This booking has been cancelled.',
};

const PIPELINE_STEPS = ['PENDING', 'PAID', 'DISPATCHED', 'EN_ROUTE', 'SHOOTING', 'SYNCING', 'EDITING', 'DELIVERED'];

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const booking = await firestoreDb.bookings.findUnique({ where: { id } });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const pkg = await firestoreDb.packages.findUnique({ where: { id: booking.packageId } });
    if (!pkg) return NextResponse.json({ error: 'Package not found for this booking' }, { status: 404 });

    let partner: any = null;
    if (booking.partnerId) {
      const partnerData = await firestoreDb.partners.findUnique({ where: { id: booking.partnerId } });
      if (partnerData) {
        const partnerUser = await firestoreDb.partnerUsers.findUnique({ where: { id: partnerData.userId } });
        partner = { ...partnerData, user: partnerUser ? { name: partnerUser.name, phone: partnerUser.phone, avatar: partnerUser.avatar } : null };
      }
    }

    const status = booking.status === 'PARTNER_DISPATCHED' ? 'DISPATCHED' : booking.status === 'READY_TO_EDIT' ? 'EDITING' : booking.status;
    const stepIndex = PIPELINE_STEPS.indexOf(status);
    const safeIndex = stepIndex < 0 ? 0 : stepIndex;
    const stepWeight = 100 / (PIPELINE_STEPS.length - 1);
    const baseProgress = safeIndex * stepWeight;
    const overallProgress = Math.min(100, Math.round(status === 'SYNCING' ? baseProgress + ((booking.syncPercentage || 0) / 100) * stepWeight : baseProgress));

    let estimatedMinutesRemaining: number | null = booking.editCountdown ?? null;
    if (estimatedMinutesRemaining == null && safeIndex < PIPELINE_STEPS.length - 1) estimatedMinutesRemaining = (PIPELINE_STEPS.length - 1 - safeIndex) * 15;

    return NextResponse.json({ tracking: {
      bookingId: booking.id,
      status,
      statusLabel: STATUS_LABELS[status] || status,
      statusDescription: STATUS_DESCRIPTIONS[status] || '',
      syncPercentage: booking.syncPercentage,
      editCountdown: booking.editCountdown,
      overallProgress,
      estimatedMinutesRemaining,
      package: { name: pkg.name, tier: pkg.tier, deliveryTime: pkg.deliveryTime },
      partner: partner ? { name: partner.user?.name || '', phone: partner.user?.phone || null, rating: partner.rating, latitude: partner.latitude, longitude: partner.longitude, lastSeenAt: partner.lastSeenAt } : null,
      bookingDate: booking.bookingDate,
      timeSlot: booking.timeSlot,
      location: booking.location,
      deliveredAt: booking.deliveredAt,
      reelUrl: booking.reelUrl ? generatePresignedUrl(booking.reelUrl) : null,
      masterReelUrl: booking.masterReelUrl ? generatePresignedUrl(booking.masterReelUrl) : null,
      hlsPlaylistUrl: booking.hlsPlaylistUrl ? generatePresignedUrl(booking.hlsPlaylistUrl) : null,
    }});
  } catch (error) {
    console.error('Error fetching tracking:', error);
    return NextResponse.json({ error: 'Failed to fetch tracking data' }, { status: 500 });
  }
}
