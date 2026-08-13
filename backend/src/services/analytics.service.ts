import { dbClient } from './db.service';

export async function getPlatformMetrics() {
  const [totalBookings, activeBookings, onlinePartners, activeEditors, paidBookings, delivered] = await Promise.all([
    dbClient.booking.count({ where: { deletedAt: null } }),
    dbClient.booking.count({ where: { status: { in: ['PAID', 'DISPATCHED', 'EN_ROUTE', 'SHOOTING', 'SYNCING', 'EDITING'] }, deletedAt: null } }),
    dbClient.partner.count({ where: { availability: true, isVerified: true, deletedAt: null } }),
    dbClient.user.count({ where: { role: 'EDITOR', status: 'ACTIVE', deletedAt: null } }),
    dbClient.booking.findMany({ where: { paymentStatus: 'SUCCESS' }, select: { packageId: true } }),
    dbClient.booking.findMany({ where: { status: 'DELIVERED', deliveredAt: { not: null } }, select: { createdAt: true, deliveredAt: true }, take: 1000, orderBy: { deliveredAt: 'desc' } }),
  ]);

  const packagePrices = await Promise.all([...new Set(paidBookings.map(b => b.packageId))].map(id => dbClient.package.findUnique({ where: { id }, select: { price: true } })));
  const totalRevenueInr = packagePrices.reduce((sum, p) => sum + (p?.price || 0), 0);
  const averageDeliveryMinutes = delivered.length
    ? delivered.reduce((sum, row) => sum + ((row.deliveredAt!.getTime() - row.createdAt.getTime()) / 60000), 0) / delivered.length
    : 0;

  return {
    totalBookings,
    totalRevenueInr,
    activeBookings,
    onlinePartners,
    activeEditors,
    averageDeliveryMinutes: Math.round(averageDeliveryMinutes * 10) / 10,
  };
}
