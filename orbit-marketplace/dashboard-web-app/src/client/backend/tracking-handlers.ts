/**
 * Client Backend | Tracking Handlers
 *
 * Real-time booking tracking business logic using Firestore:
 * - GET — Get tracking data including status label,
 *   description, sync percentage, edit countdown, overall progress,
 *   estimated time remaining, and partner info.
 *
 * Re-exported by: src/app/api/bookings/[id]/track/route.ts
 */

import { firestoreDb } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Human-readable status labels
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Booking Confirmed',
  PAID: 'Payment Verified',
  PARTNER_DISPATCHED: 'Partner En Route',
  SHOOTING: 'Shoot in Progress',
  SYNCING: 'Syncing Footage',
  EDITING: 'Editing in Progress',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

// Status descriptions
const STATUS_DESCRIPTIONS: Record<string, string> = {
  PENDING: 'Your booking has been received. Awaiting payment.',
  PAID: 'Payment received. We are finding the best partner for you.',
  PARTNER_DISPATCHED: 'A professional partner has been assigned and is on the way.',
  SHOOTING: 'Your shoot is happening right now! Sit back and relax.',
  SYNCING: 'Footage is being synced to our cloud editing suite.',
  EDITING: 'Our editors are crafting your cinematic masterpiece.',
  DELIVERED: 'Your content is ready! Check your dashboard.',
  CANCELLED: 'This booking has been cancelled.',
}

// Pipeline step order for progress calculation
const PIPELINE_STEPS = [
  'PENDING',
  'PAID',
  'PARTNER_DISPATCHED',
  'SHOOTING',
  'SYNCING',
  'EDITING',
  'DELIVERED',
]

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const booking = await firestoreDb.bookings.findUnique({
      where: { id },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    const pkg = await firestoreDb.packages.findUnique({
      where: { id: booking.packageId },
    })

    if (!pkg) {
      return NextResponse.json(
        { error: 'Package not found for this booking' },
        { status: 404 }
      )
    }

    let partner: any = null
    if (booking.partnerId) {
      const partnerData = await firestoreDb.partners.findUnique({
        where: { id: booking.partnerId },
      })
      if (partnerData) {
        const partnerUser = await firestoreDb.partnerUsers.findUnique({
          where: { id: partnerData.userId },
        })
        partner = {
          ...partnerData,
          user: partnerUser ? {
            name: partnerUser.name,
            phone: partnerUser.phone,
            avatar: partnerUser.avatar,
          } : null,
        }
      }
    }

    // Calculate overall progress percentage based on pipeline step
    const stepIndex = PIPELINE_STEPS.indexOf(booking.status)
    let overallProgress = 0
    if (stepIndex >= 0) {
      // Each step contributes equally, plus the syncPercentage within the SYNCING step
      const stepWeight = 100 / (PIPELINE_STEPS.length - 1) // -1 because DELIVERED is 100%
      const baseProgress = stepIndex * stepWeight

      if (booking.status === 'SYNCING') {
        // Add sync percentage proportionally within the syncing step
        overallProgress = baseProgress + ((booking.syncPercentage || 0) / 100) * stepWeight
      } else if (booking.status === 'EDITING') {
        // Editing is further along than just entering the step
        overallProgress = baseProgress + (((booking.syncPercentage || 0) - 75) / 25) * stepWeight
      } else {
        overallProgress = baseProgress
      }
    }

    // Cap at 100
    overallProgress = Math.min(Math.round(overallProgress), 100)

    // Estimated time remaining (in minutes)
    let estimatedMinutesRemaining: number | null = null
    if (booking.editCountdown !== null && booking.editCountdown !== undefined) {
      estimatedMinutesRemaining = booking.editCountdown
    } else if (stepIndex >= 0 && stepIndex < PIPELINE_STEPS.indexOf('DELIVERED')) {
      // Rough estimate based on remaining steps
      const remainingSteps = PIPELINE_STEPS.indexOf('DELIVERED') - stepIndex
      estimatedMinutesRemaining = remainingSteps * 20 // ~20 min per step estimate
    }

    const tracking = {
      bookingId: booking.id,
      status: booking.status,
      statusLabel: STATUS_LABELS[booking.status] || booking.status,
      statusDescription: STATUS_DESCRIPTIONS[booking.status] || '',
      syncPercentage: booking.syncPercentage,
      editCountdown: booking.editCountdown,
      overallProgress,
      estimatedMinutesRemaining,
      package: {
        name: pkg.name,
        tier: pkg.tier,
        deliveryTime: pkg.deliveryTime,
      },
      partner: partner
        ? {
            name: partner.user?.name || '',
            deviceInfo: partner.deviceInfo,
            rating: partner.rating,
          }
        : null,
      bookingDate: booking.bookingDate,
      timeSlot: booking.timeSlot,
      location: booking.location,
      deliveredAt: booking.deliveredAt,
    }

    return NextResponse.json({ tracking })
  } catch (error) {
    console.error('Error fetching tracking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tracking data' },
      { status: 500 }
    )
  }
}
