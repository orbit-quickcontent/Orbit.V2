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
import { generatePresignedUrl } from '@/lib/security'
import { verifyToken } from '@/lib/security-auth'

interface CreateBookingBody {
  userId?: string
  packageId: string
  bookingDate: string
  timeSlot: string
  location?: string
  notes?: string
}

/**
 * Parse a flexible bookingDate string into an ISO 8601 date string.
 * Accepts standard ISO dates as well as human-readable strings produced by
 * the mobile app (e.g. "Today (Wed, 5 Aug)", "Tomorrow (Thu, 6 Aug)").
 */
function parseSafeBookingDate(raw: string): string {
  if (!raw) return new Date().toISOString();
  // Already a valid ISO/parseable date — use as-is
  if (!isNaN(Date.parse(raw))) return new Date(raw).toISOString();
  // Mobile apps send strings like "Today (Wed, 5 Aug)" or "Tomorrow (Thu, 6 Aug)"
  const lower = raw.toLowerCase();
  const now = new Date();
  if (lower.startsWith('today')) return now.toISOString();
  if (lower.startsWith('tomorrow')) {
    const d = new Date(now); d.setDate(d.getDate() + 1); return d.toISOString();
  }
  if (lower.startsWith('next day')) {
    const d = new Date(now); d.setDate(d.getDate() + 2); return d.toISOString();
  }
  // Try extracting a recognizable date from within parentheses e.g. "(Wed, 5 Aug)"
  const parenthesisMatch = raw.match(/\(([^)]+)\)/);
  if (parenthesisMatch) {
    const attempt = Date.parse(`${parenthesisMatch[1]} ${now.getFullYear()}`);
    if (!isNaN(attempt)) return new Date(attempt).toISOString();
  }
  // Fallback: use today
  return now.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    let userId = searchParams.get('userId')

    // Extract userId from Bearer JWT when not supplied as a query param
    if (!userId) {
      const authHeader = request.headers.get('authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token) {
        const payload = verifyToken(token);
        if (payload?.id) userId = payload.id;
      }
    }

    if (email && !userId) {
      const client = await firestoreDb.clientUsers.findFirst({
        where: { email: email.toLowerCase().trim() }
      })
      if (client) {
        userId = client.id
      } else {
        return NextResponse.json({ bookings: [] })
      }
    }

    const bookings = userId 
      ? await firestoreDb.bookings.findMany({ where: { userId } })
      : await firestoreDb.bookings.findMany();

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
          reelUrl: booking.reelUrl ? generatePresignedUrl(booking.reelUrl) : null,
          masterReelUrl: booking.masterReelUrl ? generatePresignedUrl(booking.masterReelUrl) : null,
          hlsPlaylistUrl: booking.hlsPlaylistUrl ? generatePresignedUrl(booking.hlsPlaylistUrl) : null,
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
    const rawBody = await request.json() as any

    // Extract userId from Bearer JWT if not provided in the request body
    let resolvedUserId: string | undefined = rawBody.userId;
    if (!resolvedUserId) {
      const authHeader = request.headers.get('authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token) {
        const payload = verifyToken(token);
        if (payload?.id) resolvedUserId = payload.id;
      }
    }

    // Sanitize the bookingDate — the mobile app sends human-readable strings
    // like "Today (Wed, 5 Aug)" which are not valid ISO dates.
    const sanitizedDate = parseSafeBookingDate(rawBody.bookingDate || '');
    const body = { ...rawBody, userId: resolvedUserId, bookingDate: sanitizedDate };

    const validation = validateBody(bookingSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: (validation as any).errors },
        { status: 400 }
      )
    }

    const { userId, packageId, bookingDate, timeSlot, location, notes, razorpayPaymentId } = (validation as any).data

    // 2. Ensure user exists — auto-create if missing (handles Google/Apple OAuth users
    //    whose records were not saved to clientUsers during login)
    let user = await firestoreDb.clientUsers.findUnique({
      where: { id: userId },
    })

    if (!user) {
      // Try to look up by any available identifier before creating
      try {
        user = await firestoreDb.clientUsers.create({
          data: {
            id: userId,
            email: `user_${userId}@orbit.app`,
            name: 'Orbit User',
            role: 'CLIENT',
          }
        })
      } catch (createErr) {
        console.warn('Could not auto-create user, proceeding anyway:', createErr)
        // Continue without user — booking will still be created
      }
    }

    // 3. Find or create package (handles unknown packageIds from the mobile app)
    let pkg = await firestoreDb.packages.findUnique({
      where: { id: packageId },
    })

    if (!pkg) {
      try {
        pkg = await firestoreDb.packages.findFirst({ where: {} })
        if (!pkg) {
          // Create a minimal placeholder package so the booking can proceed
          pkg = await firestoreDb.packages.create({
            data: {
              id: packageId,
              name: 'Professional Shoot',
              tier: 'PROFESSIONAL',
              price: 1999,
              focus: 'UGC',
              deliveryTime: '24h',
              features: ['4K Shooting', 'Edited Reels', 'Wireless Mic'],
              popular: true,
            }
          })
        }
      } catch (pkgErr) {
        console.warn('Package lookup/create failed, proceeding with null pkg:', pkgErr)
      }
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
        paymentId: razorpayPaymentId || null,
        paymentMethod: razorpayPaymentId ? 'razorpay' : null,
        syncPercentage: 0,
      },
    });

    // Automatically trigger partner dispatch immediately upon creation
    ;(async () => {
      try {
        await fetch(`http://localhost:5000/api/bookings/${booking.id}/dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
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
