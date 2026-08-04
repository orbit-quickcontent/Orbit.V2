import { NextRequest, NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const editorId = searchParams.get("editorId") || "editor_1";

    // 1. Fetch bookings already assigned to (accepted by) this editor
    const assignedBookings = await firestoreDb.bookings.findMany({
      where: {
        editorId: editorId
      }
    });

    // 2. Fetch all unassigned READY_TO_EDIT bookings — these are AVAILABLE for
    //    this editor to explicitly accept. We no longer auto-assign them; the
    //    editor must tap "Accept & Edit" (POST /editor/bookings/:id) first.
    const allBookings = await firestoreDb.bookings.findMany();
    const availableBookings = allBookings.filter(
      (b) => b.status === "READY_TO_EDIT" && (!b.editorId || b.editorId === "")
    );

    // 3. Resolve client + package details for a list of bookings
    const resolveDetails = async (list: any[]) => {
      return await Promise.all(
        list.map(async (booking) => {
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
    };

    const resolvedAssigned = await resolveDetails(assignedBookings);
    const resolvedAvailable = await resolveDetails(availableBookings);

    // "bookings" = this editor's own accepted/active/delivered work
    // "available" = unclaimed READY_TO_EDIT projects waiting to be accepted
    return NextResponse.json({
      success: true,
      bookings: resolvedAssigned,
      available: resolvedAvailable,
    });
  } catch (error) {
    console.error("Error fetching editor bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch editor bookings" },
      { status: 500 }
    );
  }
}

