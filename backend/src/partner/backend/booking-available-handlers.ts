/**
 * Partner Backend | Available Bookings Handlers
 *
 * Get all available (dispatched) bookings for a partner using Firestore:
 * - Finds all PENDING WorkDispatch records for the partner
 * - Includes booking details + package info
 *
 * Re-exported by: src/app/api/bookings/available/route.ts
 * Category: Partner Backend
 */

import { firestoreDb } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')

    if (!partnerId) {
      return NextResponse.json(
        { error: 'partnerId query parameter is required' },
        { status: 400 }
      )
    }

    // Resolve partner — try by profile id first, then by userId
    let partner = await firestoreDb.partners.findUnique({ where: { id: partnerId } })
    if (!partner) {
      partner = await firestoreDb.partners.findUnique({ where: { userId: partnerId } })
    }

    // Auto-create partner profile if not found (handles new signups where
    // /auth/google or /auth/register created a user but no partner profile yet)
    if (!partner) {
      try {
        const partnerUser = await firestoreDb.partnerUsers.findUnique({ where: { id: partnerId } })
        const profileId = `prt-${partnerId}`
        partner = await firestoreDb.partners.create({
          data: {
            id: profileId,
            userId: partnerId,
            location: 'Mumbai, IN',
            latitude: 19.076,
            longitude: 72.877,
            availability: true,
            isVerified: false,
            rating: 5.0,
            completedProjects: 0,
            deviceInfo: 'Android',
            walletBalance: 0,
            displayName: partnerUser?.name || 'Orbit Partner',
          }
        })
        console.log(`[AvailableBookings] Auto-created partner profile for userId: ${partnerId}`)
      } catch (createErr) {
        console.warn('[AvailableBookings] Could not auto-create partner profile:', createErr)
        return NextResponse.json({ availableBookings: [] })
      }
    }

    // Find all PENDING WorkDispatch records for this partner
    const pendingDispatches = await firestoreDb.workDispatches.findMany({
      where: {
        partnerId: partner.id, // Ensure we use the resolved partner ID
        status: 'PENDING',
      },
    })

    // Sort dispatches by dispatchedAt descending in-memory
    pendingDispatches.sort((a, b) => {
      const dateA = a.dispatchedAt ? new Date(a.dispatchedAt).getTime() : 0;
      const dateB = b.dispatchedAt ? new Date(b.dispatchedAt).getTime() : 0;
      return dateB - dateA;
    });

    // Resolve booking, user, and package relationships in-memory
    const availableBookings = await Promise.all(
      pendingDispatches.map(async (dispatch) => {
        const booking = await firestoreDb.bookings.findUnique({
          where: { id: dispatch.bookingId },
        })

        let resolvedBooking = null
        if (booking) {
          const pkg = await firestoreDb.packages.findUnique({
            where: { id: booking.packageId },
          })
          const user = await firestoreDb.clientUsers.findUnique({
            where: { id: booking.userId },
          })
          resolvedBooking = {
            ...booking,
            package: pkg,
            user: user ? {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              brandLogo: user.brandLogo || null,
              brandFont: user.brandFont || null,
              brandColor: user.brandColor || null,
              editorRequirements: user.editorRequirements || null,
              avatar: user.avatar || null,
            } : null,
          }
        }

        return {
          dispatchId: dispatch.id,
          round: dispatch.round,
          dispatchedAt: dispatch.dispatchedAt,
          booking: resolvedBooking,
        }
      })
    )

    return NextResponse.json({ availableBookings })
  } catch (error) {
    console.error('Error fetching available bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available bookings' },
      { status: 500 }
    )
  }
}
