import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "../../../services/db.service";

export async function GET(request: NextRequest) {
  try {
    const editorId = new URL(request.url).searchParams.get("editorId");
    if (!editorId) return NextResponse.json({ error: "editorId is required" }, { status: 400 });

    const bookings = await dbClient.booking.findMany({ where: { editorId }, orderBy: { updatedAt: "desc" } });
    const resolved = await Promise.all(bookings.map(async (booking) => {
      const [client, pkg] = await Promise.all([
        dbClient.user.findUnique({ where: { id: booking.userId } }),
        dbClient.package.findUnique({ where: { id: booking.packageId } }),
      ]);
      return {
        ...booking,
        status: booking.status,
        client: client ? { id: client.id, name: client.name || "Client", email: client.email, phone: client.phone, brandColor: client.brandColor, brandFont: client.brandFont, brandLogo: client.brandLogo, editorRequirements: client.editorRequirements } : null,
        packageName: pkg?.name,
        package: pkg,
      };
    }));

    return NextResponse.json({ success: true, bookings: resolved, available: [] });
  } catch (error) {
    console.error("Error fetching editor bookings:", error);
    return NextResponse.json({ error: "Failed to fetch editor bookings" }, { status: 500 });
  }
}
