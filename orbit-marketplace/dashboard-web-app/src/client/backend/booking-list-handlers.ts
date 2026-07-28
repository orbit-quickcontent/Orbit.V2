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
import { supabase } from '@/lib/supabase-client'
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const emailParam = searchParams.get('email')

    // 1. Try fetching from Supabase Postgres first
    let query = supabase.from('bookings').select('*, packages(*)')
    if (emailParam) {
      // Find profile ID by email
      const { data: profile } = await supabase.from('profiles').select('id').eq('email', emailParam).single()
      if (profile) {
        query = query.eq('client_id', profile.id)
      }
    }

    const { data: supabaseBookings, error: supaErr } = await query.order('created_at', { ascending: false })

    if (!supaErr && supabaseBookings && supabaseBookings.length > 0) {
      const mapped = supabaseBookings.map((b: any) => ({
        id: b.id,
        userId: b.client_id,
        packageId: b.package_id,
        status: b.status,
        paymentStatus: b.payment_status || 'PAID',
        bookingDate: b.booking_date || new Date().toISOString().split('T')[0],
        timeSlot: b.time_slot || '10:00 AM - 12:00 PM',
        location: b.location_address || '',
        syncPercentage: b.sync_percentage || 0,
        editCountdown: b.edit_countdown || null,
        notes: b.notes || '',
        createdAt: b.created_at,
        package: b.packages ? {
          id: b.packages.id,
          name: b.packages.name,
          price: b.packages.price,
        } : null,
      }))
      return NextResponse.json({ bookings: mapped })
    }

    // 2. Fallback to Firestore safely
    try {
      const bookings = await firestoreDb.bookings.findMany();
      bookings.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      const bookingsWithDetails = await Promise.all(
        bookings.map(async (booking) => {
          const user = await firestoreDb.clientUsers.findUnique({
            where: { id: booking.userId },
          });

          const pkg = await firestoreDb.packages.findUnique({
            where: { id: booking.packageId },
          });

          return {
            ...booking,
            user: user ? {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
            } : null,
            package: pkg,
          };
        })
      );

      return NextResponse.json({ bookings: bookingsWithDetails })
    } catch (fsErr) {
      console.warn('Firestore fallback notice (non-fatal):', fsErr)
      return NextResponse.json({ bookings: [] })
    }
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ bookings: [] })
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
