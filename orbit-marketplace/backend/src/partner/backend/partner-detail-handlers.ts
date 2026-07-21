/**
 * Partner Backend | Partner Detail Handlers
 *
 * Individual partner endpoints using Firestore:
 * - GET   — Get partner with bookings, active/completed counts, and earnings
 * - PATCH — Update partner (availability, location, device info, rating)
 *
 * Used by: /api/partners/[id] route
 * Category: Partner Backend
 */

import { NextRequest, NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";

// GET /api/partners/[id] — Get specific partner with their bookings
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const partner = await firestoreDb.partners.findUnique({
      where: { id },
    });

    if (!partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      );
    }

    const user = await firestoreDb.partnerUsers.findUnique({
      where: { id: partner.userId }
    });

    const rawBookings = await firestoreDb.bookings.findMany({
      where: { partnerId: id },
    });

    // Resolve booking packages and users in-memory
    const bookings = await Promise.all(
      rawBookings.map(async (b) => {
        const pkg = await firestoreDb.packages.findUnique({
          where: { id: b.packageId }
        });
        const clientUser = await firestoreDb.clientUsers.findUnique({
          where: { id: b.userId }
        });
        return {
          ...b,
          package: pkg ? {
            name: pkg.name,
            tier: pkg.tier,
            price: pkg.price,
          } : null,
          user: clientUser ? {
            name: clientUser.name,
            email: clientUser.email,
          } : null,
        };
      })
    );

    // Sort by createdAt desc in-memory
    bookings.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const activeBookings = bookings.filter(
      (b) =>
        b.status === "PARTNER_DISPATCHED" ||
        b.status === "EN_ROUTE" ||
        b.status === "SHOOTING" ||
        b.status === "SYNCING"
    );

    const completedBookings = bookings.filter(
      (b) => b.status === "DELIVERED" || b.status === "EDITING" // EDITING means sync completed, partner finished shoot
    );

    return NextResponse.json({
      partner: {
        id: partner.id,
        userId: partner.userId,
        location: partner.location,
        latitude: partner.latitude,
        longitude: partner.longitude,
        availability: partner.availability,
        rating: partner.rating,
        completedProjects: partner.completedProjects,
        deviceInfo: partner.deviceInfo,
        bankName: partner.bankName || null,
        accountNumber: partner.accountNumber || null,
        ifscCode: partner.ifscCode || null,
        accountHolderName: partner.accountHolderName || null,
        bankVerified: partner.bankVerified || false,
        walletBalance: partner.walletBalance || 0.0,
        pendingClearance: partner.pendingClearance || 0.0,
        totalWithdrawn: partner.totalWithdrawn || 0.0,
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          location: user.location,
          avatar: user.avatar,
          brandLogo: user.brandLogo,
          brandFont: user.brandFont,
          brandColor: user.brandColor,
          editorRequirements: user.editorRequirements,
        } : null,
        bookings, // Expose full bookings list
        activeBookings,
        completedBookings,
        stats: {
          totalBookings: bookings.length,
          activeCount: activeBookings.length,
          completedCount: completedBookings.length,
          totalEarnings: completedBookings.reduce(
            (sum, b) => sum + (b.package?.price ?? 0),
            0
          ),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching partner:", error);
    return NextResponse.json(
      { error: "Failed to fetch partner" },
      { status: 500 }
    );
  }
}

// PATCH /api/partners/[id] — Update partner (availability, location, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as any;

    // Check if partner exists
    const existingPartner = await firestoreDb.partners.findUnique({ where: { id } });
    if (!existingPartner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      );
    }

    const updateData: {
      availability?: boolean;
      location?: string;
      latitude?: number | null;
      longitude?: number | null;
      deviceInfo?: string | null;
      rating?: number;
      completedProjects?: number;
      bankName?: string | null;
      accountNumber?: string | null;
      ifscCode?: string | null;
      accountHolderName?: string | null;
      bankVerified?: boolean;
    } = {};

    if (typeof body.availability === "boolean") {
      updateData.availability = body.availability;
    }
    if (body.location !== undefined) {
      updateData.location = body.location;
    }
    if (body.latitude !== undefined) {
      updateData.latitude = body.latitude;
    }
    if (body.longitude !== undefined) {
      updateData.longitude = body.longitude;
    }
    if (body.deviceInfo !== undefined) {
      updateData.deviceInfo = body.deviceInfo;
    }
    if (typeof body.rating === "number") {
      updateData.rating = body.rating;
    }
    if (typeof body.completedProjects === "number") {
      updateData.completedProjects = body.completedProjects;
    }
    if (body.bankName !== undefined) {
      updateData.bankName = body.bankName;
    }
    if (body.accountNumber !== undefined) {
      updateData.accountNumber = body.accountNumber;
    }
    if (body.ifscCode !== undefined) {
      updateData.ifscCode = body.ifscCode;
    }
    if (body.accountHolderName !== undefined) {
      updateData.accountHolderName = body.accountHolderName;
    }
    if (typeof body.bankVerified === "boolean") {
      updateData.bankVerified = body.bankVerified;
    }

    const updatedPartner = await firestoreDb.partners.update({
      where: { id },
      data: updateData,
    });

    const user = await firestoreDb.partnerUsers.findUnique({
      where: { id: updatedPartner.userId }
    });

    const partnerWithUser = {
      ...updatedPartner,
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
      } : null,
    };

    return NextResponse.json({ partner: partnerWithUser });
  } catch (error) {
    console.error("Error updating partner:", error);
    return NextResponse.json(
      { error: "Failed to update partner" },
      { status: 500 }
    );
  }
}
