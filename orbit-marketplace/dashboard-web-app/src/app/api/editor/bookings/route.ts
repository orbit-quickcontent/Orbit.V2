import { NextRequest, NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const editorId = searchParams.get("editorId") || "editor_1";

    const assignedBookings = await firestoreDb.bookings.findMany({
      where: {
        editorId: editorId
      }
    });

    const availableBookings = await firestoreDb.bookings.findMany({
      where: {
        status: "EDITING",
        editorId: null
      }
    });

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

    return NextResponse.json({
      success: true,
      bookings: resolvedAssigned,
      available: resolvedAvailable
    });
  } catch (error) {
    console.error("Error fetching editor bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
