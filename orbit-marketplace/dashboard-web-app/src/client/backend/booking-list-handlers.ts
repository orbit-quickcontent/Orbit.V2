/**
 * Client Backend | Booking List Handlers
 *
 * Booking list business logic using Firestore:
 * - GET  — List all bookings with user, package, and partner info
 * - POST — Create a new booking (userId, packageId, bookingDate, timeSlot required)
 *
 * Re-exported by: src/app/api/bookings/route.ts
 */

import { firestoreDb } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { validateBody, bookingSchema } from '@/lib/validation'
import { logAudit } from '@/lib/auth-server'

interface CreateBookingBody {
  userId: string
  packageId: string
  bookingDate: string
  timeSlot: string
  location?: string
  notes?: string
}

export async function GET() {
  try {
    const bookings = await firestoreDb.bookings.findMany();

    // Sort by createdAt desc in-memory
    bookings.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // Resolve user, package, and partner details in-memory
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const user = await firestoreDb.clientUsers.findUnique({
          where: { id: booking.userId },
        });

        const pkg = await firestoreDb.packages.findUnique({
          where: { id: booking.packageId },
        });

        let partner = null;
        if (booking.partnerId) {
          const partnerData = await firestoreDb.partners.findUnique({
            where: { id: booking.partnerId },
          });
          if (partnerData) {
            const partnerUser = await firestoreDb.partnerUsers.findUnique({
              where: { id: partnerData.userId },
            });
            partner = {
              ...partnerData,
              user: partnerUser ? {
                id: partnerUser.id,
                name: partnerUser.name,
                phone: partnerUser.phone,
                avatar: partnerUser.avatar,
              } : null,
            };
          }
        }

        return {
          ...booking,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
          } : null,
          package: pkg,
          partner,
        };
      })
    );

    return NextResponse.json({ bookings: bookingsWithDetails })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 1. Zod input validation
    const validation = validateBody(bookingSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      )
    }

    const { userId, packageId, bookingDate, timeSlot, location, notes } = validation.data

    // 2. Verify user exists in client DB
    const user = await firestoreDb.clientUsers.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 3. Verify package exists
    const pkg = await firestoreDb.packages.findUnique({
      where: { id: packageId },
    })

    if (!pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    const booking = await firestoreDb.bookings.create({
      data: {
        userId,
        packageId,
        bookingDate: new Date(bookingDate).toISOString(),
        timeSlot,
        location: location || null,
        notes: notes || null,
        status: 'PAID',
        paymentStatus: 'SUCCESS',
        syncPercentage: 0,
      },
    });

    // Automatically trigger partner dispatch immediately upon creation
    ;(async () => {
      try {
        await fetch(`http://localhost:3000/api/bookings/${booking.id}/dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        
        // Automatically trigger partner accept after 1.5 seconds to simulate picking up the ride
        setTimeout(async () => {
          try {
            await fetch(`http://localhost:3000/api/bookings/${booking.id}/accept`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ partnerId: 'prt-arjun' }),
            })
          } catch (acceptErr) {
            console.error('Failed to trigger automatic accept:', acceptErr)
          }
        }, 1500)
      } catch (dispatchErr) {
        console.error('Failed to trigger automatic dispatch:', dispatchErr)
      }
    })()

    // Map relationships to match original payload
    const bookingWithRelations = {
      ...booking,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      package: pkg,
    };

    // 4. Record audit log
    await logAudit({
      userId,
      action: "CREATE_BOOKING",
      entity: "Booking",
      entityId: booking.id,
      details: { packageId, bookingDate, timeSlot },
      req: request,
    })

    return NextResponse.json({ booking: bookingWithRelations }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
