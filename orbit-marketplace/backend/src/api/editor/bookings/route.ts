import { NextRequest, NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const editorId = searchParams.get("editorId") || "editor_1";

    // 1. Fetch bookings already assigned to this editor
    const assignedBookings = await firestoreDb.bookings.findMany({
      where: {
        editorId: editorId
      }
    });

    // 2. Fetch all bookings to find any unassigned READY_TO_EDIT or EDITING bookings
    const allBookings = await firestoreDb.bookings.findMany();
    const unassignedBookings = allBookings.filter(
      (b) => (b.status === "READY_TO_EDIT" || b.status === "EDITING") && (!b.editorId || b.editorId === "")
    );

    // 3. Auto-assign unassigned bookings to this editor
    if (unassignedBookings.length > 0) {
      await Promise.all(
        unassignedBookings.map((b) =>
          firestoreDb.bookings.update({
            where: { id: b.id },
            data: { editorId }
          })
        )
      );
    }

    // 4. Combine both lists
    const targetBookings = [
      ...assignedBookings,
      ...unassignedBookings.map((b) => ({ ...b, editorId })),
    ];

    // Resolve client details
    const resolvedBookings = await Promise.all(
      targetBookings.map(async (booking) => {
        const client = await firestoreDb.clientUsers.findUnique({
          where: { id: booking.userId }
        });
        const pkg = await firestoreDb.packages.findUnique({
          where: { id: booking.packageId }
        });
        
        return {
          ...booking,
          client: client ? {
            id: client.id,
            name: client.name || "Client",
            email: client.email,
            phone: client.phone || "N/A",
            brandColor: client.brandColor,
            brandFont: client.brandFont,
            brandLogo: client.brandLogo,
            editorRequirements: client.editorRequirements
          } : null,
          package: pkg
        };
      })
    );

    return NextResponse.json({ success: true, bookings: resolvedBookings });
  } catch (error) {
    console.error("Error fetching editor bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
