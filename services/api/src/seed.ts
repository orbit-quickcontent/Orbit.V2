import { PrismaClient, PartnerStatus } from '@prisma/client';
import { addPartnerToGeoSet, redis } from './config/redis';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ORBIT database & Redis seed...');

  // Clean existing tables
  await prisma.locationHistory.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.partner.deleteMany();

  // Clear Redis GEO set
  await redis.del('partners:online');

  const seedPartners = [
    {
      name: 'Rahul Sharma',
      email: 'rahul@orbit.com',
      phone: '+919820011223',
      vehicleType: 'Sony FX3 Cinema Rig',
      status: PartnerStatus.ONLINE,
      rating: 4.9,
      latitude: 19.076,
      longitude: 72.8777,
    },
    {
      name: 'Priya Verma',
      email: 'priya@orbit.com',
      phone: '+919820022334',
      vehicleType: 'RED Komodo 6K Drone Package',
      status: PartnerStatus.ONLINE,
      rating: 4.8,
      latitude: 19.082,
      longitude: 72.881,
    },
    {
      name: 'Vikram Mehta',
      email: 'vikram@orbit.com',
      phone: '+919820033445',
      vehicleType: 'Canon R5 C Gimbal Rig',
      status: PartnerStatus.BUSY,
      rating: 4.7,
      latitude: 19.065,
      longitude: 72.869,
    },
    {
      name: 'Ananya Roy',
      email: 'ananya@orbit.com',
      phone: '+919820044556',
      vehicleType: 'Blackmagic Pocket 6K',
      status: PartnerStatus.OFFLINE,
      rating: 5.0,
      latitude: 19.1197,
      longitude: 72.905,
    },
  ];

  for (const partnerData of seedPartners) {
    const partner = await prisma.partner.create({ data: partnerData });
    console.log(`Created partner: ${partner.name} (${partner.id})`);

    // Add ONLINE/BUSY partners to Redis GEO set
    if (partner.status === PartnerStatus.ONLINE || partner.status === PartnerStatus.BUSY) {
      await addPartnerToGeoSet(partner.id, partner.latitude, partner.longitude);
      console.log(`Added ${partner.name} to Redis GEO set 'partners:online'`);
    }
  }

  // Create initial sample booking
  const booking = await prisma.booking.create({
    data: {
      clientId: 'client-mumbai-user-1',
      pickupLat: 19.0728,
      pickupLng: 72.8826,
      destinationLat: 19.1197,
      destinationLng: 72.905,
      status: 'PENDING',
    },
  });

  console.log(`Created sample booking: ${booking.id}`);
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    redis.disconnect();
  });
