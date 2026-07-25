/**
 * Client Backend | Package Handlers
 *
 * Package listing business logic using Firestore.
 * - GET — List all packages, seeded if none exist.
 *   Features are stored as JSON strings and parsed on read.
 *
 * Re-exported by: src/app/api/packages/route.ts
 */

import { supabase } from '@/lib/supabase-client'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data: packages, error } = await supabase
      .from('packages')
      .select('*')
      .order('price', { ascending: true })

    if (error) {
      console.warn('[Supabase API] Error fetching packages:', error)
    }

    if (packages && packages.length > 0) {
      const result = packages.map((pkg: any) => {
        let parsedFeatures = []
        try {
          parsedFeatures = typeof pkg.features === 'string' ? JSON.parse(pkg.features) : (pkg.features || [])
        } catch {
          parsedFeatures = []
        }
        return {
          id: pkg.id,
          name: pkg.name,
          tier: pkg.tier || (pkg.id === 'pkg-personalized' ? 'PERSONALIZED' : pkg.id === 'pkg-professional' ? 'PROFESSIONAL' : 'ENTERPRISE'),
          price: pkg.price,
          focus: pkg.focus,
          deliveryTime: pkg.delivery_time || '60-120 mins',
          features: parsedFeatures,
          popular: pkg.popular || false,
        }
      })
      return NextResponse.json({ packages: result })
    }

    // Fallback default packages if table is empty
    const defaultPackages = [
      {
        id: 'pkg-personalized',
        name: 'Personalized',
        tier: 'PERSONALIZED',
        price: 1999,
        focus: 'Individual/Event cinematic reels',
        deliveryTime: '60-120 mins',
        features: ['1 cinematic reel (30-60 sec)', 'Professional color grading', 'Background score licensing', 'Same-day delivery (60-90 mins)', '1 revision round'],
        popular: false,
      },
      {
        id: 'pkg-professional',
        name: 'Professional (UGC)',
        tier: 'PROFESSIONAL',
        price: 4999,
        focus: 'Brand-focused storytelling with Brand DNA',
        deliveryTime: '60-120 mins',
        features: ['3 cinematic reels (30-60 sec each)', 'Brand DNA integration (logo, palette, font)', 'Professional color grading', 'Licensed background score', 'Same-day express delivery', '2 revision rounds'],
        popular: true,
      },
      {
        id: 'pkg-enterprise',
        name: 'Enterprise Campaign',
        tier: 'ENTERPRISE',
        price: 9999,
        focus: 'Full-scale brand ad campaign & raw master files',
        deliveryTime: '60-120 mins',
        features: ['5 Cinematic Ads & Shorts', '4K Raw 10-bit Footage Access', 'Dedicated Senior Editor', 'Unlimited revisions for 7 days', 'Commercial Licensing Rights'],
        popular: false,
      },
    ]

    return NextResponse.json({ packages: defaultPackages })
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}
