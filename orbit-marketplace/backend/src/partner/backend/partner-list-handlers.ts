/**
 * Partner Backend | Partner List Handlers
 *
 * Partner list endpoints using Firestore:
 * - GET  — List all partners with user info and booking stats
 * - POST — Create a new partner (links to existing user, updates user role)
 *
 * Used by: /api/partners route
 * Category: Partner Backend
 */

import { NextRequest, NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";
import { validateBody, partnerSchema } from "@/lib/validation";
import { logAudit } from "@/lib/auth-server";

// GET /api/partners — List all partners with their user info and stats
export async function GET() {
  try {
    const partners = await firestoreDb.partners.findMany();

    // Sort by createdAt desc in-memory
    partners.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const bookings = await firestoreDb.bookings.findMany();

    const bookingsByPartner = new Map<string, { id: string; status: string }[]>();
    for (const b of bookings) {
      if (b.partnerId) {
        if (!bookingsByPartner.has(b.partnerId)) {
          bookingsByPartner.set(b.partnerId, []);
        }
        bookingsByPartner.get(b.partnerId)!.push(b);
      }
    }

    const partnersWithStats = await Promise.all(
      partners.map(async (partner) => {
        const user = await firestoreDb.partnerUsers.findUnique({
          where: { id: partner.userId }
        });

        const partnerBookings = bookingsByPartner.get(partner.id) || [];
        return {
          id: partner.id,
          userId: partner.userId,
          location: partner.location,
          latitude: partner.latitude,
          longitude: partner.longitude,
          availability: partner.availability,
          rating: partner.rating,
          completedProjects: partner.completedProjects,
          deviceInfo: partner.deviceInfo,
          createdAt: partner.createdAt,
          updatedAt: partner.updatedAt,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
          } : null,
          stats: {
            totalBookings: partnerBookings.length,
            activeBookings: partnerBookings.filter(
              (b) => b.status === "SHOOTING" || b.status === "SYNCING"
            ).length,
            completedBookings: partnerBookings.filter(
              (b) => b.status === "DELIVERED"
            ).length,
          },
        };
      })
    );

    return NextResponse.json({ partners: partnersWithStats });
  } catch (error) {
    console.error("Error fetching partners:", error);
    return NextResponse.json(
      { error: "Failed to fetch partners" },
      { status: 500 }
    );
  }
}

// POST /api/partners — Create a new partner (link to existing user)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateBody(partnerSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: (validation as any).errors },
        { status: 400 }
      );
    }

    const { userId, location, latitude, longitude, deviceInfo } = (validation as any).data;

    // 2. Check if user exists in partner DB
    const user = await firestoreDb.partnerUsers.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 3. Check if user is already a partner
    const existingPartner = await firestoreDb.partners.findUnique({
      where: { userId },
    });
    if (existingPartner) {
      return NextResponse.json(
        { error: "User is already a partner" },
        { status: 409 }
      );
    }

    // 4. Create partner and update user role
    const partner = await firestoreDb.partners.create({
      data: {
        userId,
        location,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        deviceInfo: deviceInfo ?? null,
        availability: true,
        rating: 4.8,
        completedProjects: 0,
        walletBalance: 0.0,
        pendingClearance: 0.0,
        totalWithdrawn: 0.0,
      },
    });

    // 5. Update user role to PARTNER in partner DB
    await firestoreDb.partnerUsers.update({
      where: { id: userId },
      data: { role: "PARTNER" },
    });

    const partnerWithUser = {
      ...partner,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
      },
    };

    // 6. Log audit event
    await logAudit({
      userId,
      action: "PARTNER_ONBOARD",
      entity: "Partner",
      entityId: partner.id,
      details: { userId, location },
      req: request,
    });

    return NextResponse.json({ partner: partnerWithUser }, { status: 201 });
  } catch (error) {
    console.error("Error creating partner:", error);
    return NextResponse.json(
      { error: "Failed to create partner" },
      { status: 500 }
    );
  }
}
