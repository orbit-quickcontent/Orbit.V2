import { NextRequest, NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";
import { logAudit } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  try {
    const { partnerId, isVerified } = await request.json();

    if (!partnerId) {
      return NextResponse.json({ error: "partnerId is required" }, { status: 400 });
    }

    const partner = await firestoreDb.partners.update({
      where: { id: partnerId },
      data: { isVerified: !!isVerified },
    });

    // Write audit log
    await logAudit({
      userId: null,
      action: isVerified ? "VERIFY_PARTNER" : "UNVERIFY_PARTNER",
      entity: "Partner",
      entityId: partnerId,
      details: { isVerified },
      req: request,
    });

    return NextResponse.json({ success: true, partner });
  } catch (error) {
    console.error("Error toggling partner verification:", error);
    return NextResponse.json(
      { error: "Failed to update partner verification" },
      { status: 500 }
    );
  }
}
