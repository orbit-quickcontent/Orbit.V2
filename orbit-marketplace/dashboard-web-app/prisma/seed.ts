import { firestoreDb } from '../src/lib/db';

async function seed() {
  console.log('🌱 Seeding database...');

  // Seed Packages in Client DB
  const personalized = await firestoreDb.packages.upsert({
    where: { tier: 'PERSONALIZED' },
    update: {},
    create: {
      name: 'Personalized',
      tier: 'PERSONALIZED',
      price: 1999,
      focus: 'Individual/Event cinematic reels',
      deliveryTime: '60-120 mins',
      features: JSON.stringify([
        'Professional cinematic edit',
        '1 Reel (up to 60 sec)',
        'Color grading & transitions',
        'Background music sync',
        '60-120 min delivery',
        '1 revision round',
      ]),
      popular: false,
    },
  });

  const professional = await firestoreDb.packages.upsert({
    where: { tier: 'PROFESSIONAL' },
    update: {},
    create: {
      name: 'Professional (UGC)',
      tier: 'PROFESSIONAL',
      price: 4999,
      focus: 'Brand-focused storytelling with Brand DNA',
      deliveryTime: '60-120 mins',
      features: JSON.stringify([
        'All Personalized features',
        'Brand DNA integration',
        'Logo/Font/Palette matching',
        'Up to 3 Reels (60 sec each)',
        'Multi-platform optimization',
        '2 revision rounds',
        'Priority editing queue',
      ]),
      popular: true,
    },
  });

  console.log(`✓ Packages: ${personalized.tier}, ${professional.tier}`);

  // Seed a demo user in Client DB
  const demoUser = await firestoreDb.clientUsers.upsert({
    where: { email: 'demo@orbitlogic.io' },
    update: {},
    create: {
      email: 'demo@orbitlogic.io',
      name: 'Demo Client',
      phone: '+91 98765 43210',
      location: 'Mumbai, India',
      role: 'USER',
    },
  });
  console.log(`✓ Demo user: ${demoUser.email}`);

  // Seed a partner user in Partner DB
  const partnerUser = await firestoreDb.partnerUsers.upsert({
    where: { email: 'partner@orbitlogic.io' },
    update: {},
    create: {
      email: 'partner@orbitlogic.io',
      name: 'Arjun Kapoor',
      phone: '+91 99887 76655',
      location: 'New Delhi, India',
      role: 'PARTNER',
    },
  });

  const partner = await firestoreDb.partners.upsert({
    where: { userId: partnerUser.id },
    update: {
      walletBalance: 0.0,
      pendingClearance: 0.0,
      totalWithdrawn: 0.0,
    },
    create: {
      userId: partnerUser.id,
      location: 'Connaught Place, New Delhi',
      latitude: 28.6315,
      longitude: 77.2167,
      availability: true,
      rating: 4.9,
      completedProjects: 47,
      deviceInfo: 'iPhone 15 Pro Max',
      walletBalance: 0.0,
      pendingClearance: 0.0,
      totalWithdrawn: 0.0,
    },
  });
  console.log(`✓ Partner: ${partnerUser.name} (${partner.deviceInfo})`);

  // Seed another partner in Partner DB
  const partner2User = await firestoreDb.partnerUsers.upsert({
    where: { email: 'priya@orbitlogic.io' },
    update: {},
    create: {
      email: 'priya@orbitlogic.io',
      name: 'Priya Sharma',
      phone: '+91 88776 65544',
      location: 'Mumbai, India',
      role: 'PARTNER',
    },
  });

  const partner2 = await firestoreDb.partners.upsert({
    where: { userId: partner2User.id },
    update: {
      walletBalance: 0.0,
      pendingClearance: 0.0,
      totalWithdrawn: 0.0,
    },
    create: {
      userId: partner2User.id,
      location: 'Bandra, Mumbai',
      latitude: 19.0596,
      longitude: 72.8295,
      availability: true,
      rating: 4.8,
      completedProjects: 32,
      deviceInfo: 'Google Pixel 8 Pro',
      walletBalance: 0.0,
      pendingClearance: 0.0,
      totalWithdrawn: 0.0,
    },
  });
  console.log(`✓ Partner: ${partner2User.name} (${partner2.deviceInfo})`);

  console.log('🌱 Seeding complete!');
}

seed()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  });
