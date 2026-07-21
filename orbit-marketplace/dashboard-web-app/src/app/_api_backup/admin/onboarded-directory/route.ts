/**
 * Admin Backend | Onboarded Directory Aggregator API using Firestore
 *
 * Aggregates onboarded partners and clients directory, showing verification status,
 * booking summaries, ratings, and system-wide statistics for admin dashboards.
 *
 * Endpoint: GET /api/admin/onboarded-directory
 */

import { NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";

export async function GET() {
  try {
    // 1. Fetch directories and bookings from Firestore
    const partners = await firestoreDb.partners.findMany();
    const clientUsers = await firestoreDb.clientUsers.findMany();
    const bookings = await firestoreDb.bookings.findMany();
    const packages = (await firestoreDb.packages.findMany()) as any[];

    // Map packages for fast lookup in-memory
    const packageMap = new Map(packages.map((pkg) => [pkg.id, pkg]));

    // System-wide metrics
    const totalPartners = partners.length;
    const verifiedPartners = partners.filter((p) => p.isVerified).length;
    const onlinePartners = partners.filter((p) => p.availability).length;
    const totalClients = clientUsers.length; // all client users have role USER/ADMIN
    const totalBookings = bookings.length;

    // Sort partners by createdAt desc
    partners.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const bookingsByPartner = new Map<string, typeof bookings>();
    for (const b of bookings) {
      if (b.partnerId) {
        if (!bookingsByPartner.has(b.partnerId)) {
          bookingsByPartner.set(b.partnerId, []);
        }
        bookingsByPartner.get(b.partnerId)!.push(b);
      }
    }

    // 2. Fetch partners with stats
    const partnerDirectory = await Promise.all(
      partners.map(async (p) => {
        const u = await firestoreDb.partnerUsers.findUnique({
          where: { id: p.userId },
        });

        const partnerBookings = bookingsByPartner.get(p.id) || [];
        const completed = partnerBookings.filter((b) => b.status === "DELIVERED");
        const active = partnerBookings.filter(
          (b) => b.status !== "DELIVERED" && b.status !== "CANCELLED" && b.status !== "PENDING"
        );

        const totalEarnings = completed.length * 700;

        return {
          id: p.id,
          userId: p.userId,
          name: u?.name || "N/A",
          email: u?.email || "N/A",
          phone: u?.phone || "N/A",
          avatar: u?.avatar,
          location: p.location,
          isVerified: p.isVerified,
          availability: p.availability ? "ONLINE" : "OFFLINE",
          rating: p.rating,
          completedProjects: p.completedProjects,
          deviceInfo: p.deviceInfo,
          walletBalance: p.walletBalance || 0.0,
          totalWithdrawn: p.totalWithdrawn || 0.0,
          stats: {
            totalBookings: partnerBookings.length,
            completedBookings: completed.length,
            activeBookings: active.length,
            totalEarnings,
          },
          createdAt: p.createdAt,
        };
      })
    );

    // Sort clientUsers by createdAt desc
    clientUsers.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // 3. Fetch clients with stats
    const clientDirectory = await Promise.all(
      clientUsers.map(async (c) => {
        const clientBookings = bookings.filter((b) => b.userId === c.id);
        const completed = clientBookings.filter((b) => b.status === "DELIVERED");
        const spent = completed.reduce((sum, b) => {
          const pkg = packageMap.get(b.packageId);
          return sum + (pkg?.price || 0);
        }, 0);

        return {
          id: c.id,
          name: c.name || "N/A",
          email: c.email || "N/A",
          phone: c.phone || "N/A",
          avatar: c.avatar,
          brandLogo: c.brandLogo,
          brandFont: c.brandFont,
          brandColor: c.brandColor,
          createdAt: c.createdAt,
          stats: {
            totalBookings: clientBookings.length,
            completedBookings: completed.length,
            totalSpent: spent,
          },
        };
      })
    );

    // Sort bookings by createdAt desc
    bookings.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const bookingsList = bookings.map((b) => {
      const u = clientUsers.find((user) => user.id === b.userId);
      const pkg = packageMap.get(b.packageId);
      return {
        id: b.id,
        packageName: pkg?.name || "Personalized",
        packagePrice: pkg?.price || 1999,
        clientName: u?.name || "N/A",
        clientEmail: u?.email || "N/A",
        status: b.status,
        createdAt: b.createdAt,
        paymentStatus: b.paymentStatus || "SUCCESS"
      };
    });

    return NextResponse.json({
      success: true,
      metrics: {
        totalPartners,
        verifiedPartners,
        onlinePartners,
        verificationRate: totalPartners > 0 ? (verifiedPartners / totalPartners) * 100 : 0,
        totalClients,
        totalBookings,
      },
      partners: partnerDirectory,
      clients: clientDirectory,
      bookings: bookingsList,
    });
  } catch (error) {
    console.error("Error aggregating admin onboarded-directory:", error);
    return NextResponse.json(
      { error: "Failed to aggregate directory data" },
      { status: 500 }
    );
  }
}
