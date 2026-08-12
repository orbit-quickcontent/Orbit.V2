import { firestoreDb } from '../src/services/firestore-db';

async function main() {
  console.log('🌱 Seeding Orbit database & partner verification codes...');

  const nowIso = new Date().toISOString();

  // 1. Create Master Partner (orbit.quickcontent@gmail.com / 123456)
  const masterUser = await firestoreDb.partnerUsers.upsert({
    where: { email: 'orbit.quickcontent@gmail.com' },
    create: {
      email: 'orbit.quickcontent@gmail.com',
      name: 'Orbit Master Partner',
      role: 'PARTNER',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    update: {
      status: 'ACTIVE',
      kycStatus: 'VERIFIED'
    }
  });

  await firestoreDb.partners.upsert({
    where: { userId: masterUser.id },
    create: {
      userId: masterUser.id,
      location: 'Mumbai HQ, India',
      latitude: 19.0760,
      longitude: 72.8777,
      availability: true,
      verificationCode: '123456',
      isVerified: true,
      verifiedAt: nowIso,
      rating: 5.0,
      completedProjects: 124,
      walletBalance: 25000.0
    },
    update: {
      isVerified: true,
      verificationCode: '123456',
      availability: true
    }
  });

  // 2. Create Sample Test Client
  await firestoreDb.clientUsers.upsert({
    where: { email: 'client@test.com' },
    create: {
      email: 'client@test.com',
      name: 'Test Client User',
      role: 'CLIENT',
      status: 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    update: { status: 'ACTIVE' }
  });

  console.log('✅ Database seeded successfully!');
  console.log('  - Master Partner: orbit.quickcontent@gmail.com');
  console.log('  - Master Verification Code: 123456');
  console.log('  - Default Seed Code: ORBIT2024');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  });
