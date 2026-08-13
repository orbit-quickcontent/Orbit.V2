import { dbClient } from './db.service';

export interface BookingEconomics {
  grossAmount: number;
  partnerEarningAmount: number;
  editorPayoutAmount: number;
  taxAmount: number;
  platformCommissionAmount: number;
}

function positiveInt(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback;
}

export function calculatePackageEconomics(pkg: {
  price: number;
  partnerPayoutAmount?: number | null;
  editorPayoutAmount?: number | null;
  taxAmount?: number | null;
}): BookingEconomics {
  const grossAmount = positiveInt(pkg.price);
  const partnerEarningAmount = positiveInt(
    pkg.partnerPayoutAmount,
    Number(process.env.ORBIT_DEFAULT_PARTNER_EARNING || 700),
  );
  const editorPayoutAmount = positiveInt(pkg.editorPayoutAmount, 0);
  const taxAmount = positiveInt(pkg.taxAmount, 0);
  const platformCommissionAmount = grossAmount - partnerEarningAmount - editorPayoutAmount - taxAmount;

  if (platformCommissionAmount < 0) {
    throw new Error('Package payout configuration exceeds client price');
  }

  return {
    grossAmount,
    partnerEarningAmount,
    editorPayoutAmount,
    taxAmount,
    platformCommissionAmount,
  };
}

export async function ensurePartnerEarningSnapshot(bookingId: string): Promise<BookingEconomics> {
  const booking = await dbClient.booking.findUnique({
    where: { id: bookingId },
    include: { package: true },
  });
  if (!booking) throw new Error('Booking not found');

  const economics = calculatePackageEconomics(booking.package);

  await dbClient.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        partnerEarningAmount: economics.partnerEarningAmount,
        platformCommissionAmount: economics.platformCommissionAmount,
        taxAmount: economics.taxAmount,
        editorPayoutAmount: economics.editorPayoutAmount,
      },
    });

    if (booking.partnerId) {
      await tx.partnerEarning.upsert({
        where: { bookingId },
        update: {
          grossAmount: economics.grossAmount,
          platformCommissionAmount: economics.platformCommissionAmount,
          taxAmount: economics.taxAmount,
          editorPayoutAmount: economics.editorPayoutAmount,
          partnerEarningAmount: economics.partnerEarningAmount,
        },
        create: {
          bookingId,
          partnerId: booking.partnerId,
          grossAmount: economics.grossAmount,
          platformCommissionAmount: economics.platformCommissionAmount,
          taxAmount: economics.taxAmount,
          editorPayoutAmount: economics.editorPayoutAmount,
          partnerEarningAmount: economics.partnerEarningAmount,
          status: 'PENDING',
        },
      });
    }
  });

  return economics;
}

export async function attachPartnerEarningSnapshot(bookingId: string, partnerId: string): Promise<BookingEconomics> {
  const booking = await dbClient.booking.findUnique({
    where: { id: bookingId },
    include: { package: true },
  });
  if (!booking) throw new Error('Booking not found');

  const economics = calculatePackageEconomics(booking.package);

  await dbClient.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        partnerEarningAmount: economics.partnerEarningAmount,
        platformCommissionAmount: economics.platformCommissionAmount,
        taxAmount: economics.taxAmount,
        editorPayoutAmount: economics.editorPayoutAmount,
      },
    });

    await tx.partnerEarning.upsert({
      where: { bookingId },
      update: {
        partnerId,
        grossAmount: economics.grossAmount,
        platformCommissionAmount: economics.platformCommissionAmount,
        taxAmount: economics.taxAmount,
        editorPayoutAmount: economics.editorPayoutAmount,
        partnerEarningAmount: economics.partnerEarningAmount,
      },
      create: {
        bookingId,
        partnerId,
        grossAmount: economics.grossAmount,
        platformCommissionAmount: economics.platformCommissionAmount,
        taxAmount: economics.taxAmount,
        editorPayoutAmount: economics.editorPayoutAmount,
        partnerEarningAmount: economics.partnerEarningAmount,
        status: 'PENDING',
      },
    });
  });

  return economics;
}

export async function releasePartnerEarning(bookingId: string): Promise<void> {
  await dbClient.$transaction(async (tx) => {
    const earning = await tx.partnerEarning.findUnique({ where: { bookingId } });
    if (!earning || earning.status === 'PAID' || earning.status === 'AVAILABLE') return;

    const now = new Date();
    await tx.partnerEarning.update({
      where: { bookingId },
      data: {
        status: 'AVAILABLE',
        availableAt: now,
      },
    });

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        partnerEarningStatus: 'AVAILABLE',
        partnerEarningAvailableAt: now,
      },
    });

    await tx.partner.update({
      where: { id: earning.partnerId },
      data: {
        walletBalance: { increment: earning.partnerEarningAmount },
        pendingClearance: { decrement: Math.min(earning.partnerEarningAmount, undefined as never) },
      },
    }).catch(async () => {
      await tx.partner.update({
        where: { id: earning.partnerId },
        data: { walletBalance: { increment: earning.partnerEarningAmount } },
      });
    });

    await tx.transaction.create({
      data: {
        partnerId: earning.partnerId,
        bookingId,
        type: 'EARNING',
        amount: earning.partnerEarningAmount,
        status: 'COMPLETED',
        description: `Partner earning for booking ${bookingId}`,
      },
    });
  });
}
