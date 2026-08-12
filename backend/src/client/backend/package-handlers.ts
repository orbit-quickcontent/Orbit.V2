/**
 * Client Backend | Package Handlers
 *
 * Package listing business logic using Firestore.
 * - GET — List all packages, seeded if none exist.
 *   Features are stored as JSON strings and parsed on read.
 *
 * Re-exported by: src/app/api/packages/route.ts
 */

import { firestoreDb } from '@/lib/db'
import { NextResponse } from 'next/server'

const SEED_PACKAGES = [
  {
    name: 'Personalized',
    tier: 'PERSONALIZED',
    price: 1999,
    focus: 'Individual/Event cinematic reels',
    deliveryTime: '60-120 mins',
    features: JSON.stringify([
      '1 cinematic reel (30-60 sec)',
      'Professional color grading',
      'Background score licensing',
      'Same-day delivery',
      '1 revision round',
    ]),
    popular: false,
  },
  {
    name: 'Professional (UGC)',
    tier: 'PROFESSIONAL',
    price: 4999,
    focus: 'Brand-focused storytelling with Brand DNA',
    deliveryTime: '60-120 mins',
    features: JSON.stringify([
      '3 cinematic reels (30-60 sec each)',
      'Brand DNA integration (logo, palette, font)',
      'Professional color grading',
      'Licensed background score',
      'Same-day delivery',
      '2 revision rounds',
      'Dedicated partner assignment',
    ]),
    popular: true,
  },
]

export async function GET() {
  try {
    let packages = await firestoreDb.packages.findMany();

    // Seed packages if none exist
    if (packages.length === 0) {
      for (const pkg of SEED_PACKAGES) {
        await firestoreDb.packages.create({ data: pkg });
      }
      packages = await firestoreDb.packages.findMany();
    }

    // Sort by price ascending
    packages.sort((a, b) => a.price - b.price);

    // Parse features JSON for each package
    const result = packages.map((pkg) => {
      let parsedFeatures = [];
      try {
        parsedFeatures = typeof pkg.features === 'string' ? JSON.parse(pkg.features) : (pkg.features || []);
      } catch {
        parsedFeatures = [];
      }
      return {
        ...pkg,
        features: parsedFeatures,
      };
    });

    return NextResponse.json({ packages: result })
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}
