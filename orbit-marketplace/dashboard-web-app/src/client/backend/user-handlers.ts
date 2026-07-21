/**
 * Client Backend | User Handlers
 *
 * User management business logic using Firestore.
 * - GET  — List all users with booking counts
 * - POST — Create a new user (email required, unique)
 *
 * Re-exported by: src/app/api/users/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";
import { validateBody, userSchema } from "@/lib/validation";
import { logAudit } from "@/lib/auth-server";

// GET — List users
export async function GET() {
  try {
    const clientUsers = await firestoreDb.clientUsers.findMany();
    const partnerUsers = await firestoreDb.partnerUsers.findMany();
    const allUsers = [...clientUsers, ...partnerUsers];

    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        // Count bookings in-memory by querying bookings collection
        const bookings = await firestoreDb.bookings.findMany({
          where: { userId: user.id }
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          location: user.location,
          role: user.role,
          brandLogo: user.brandLogo,
          brandFont: user.brandFont,
          brandColor: user.brandColor,
          editorRequirements: user.editorRequirements,
          avatar: user.avatar,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          totalBookings: bookings.length,
        };
      })
    );

    // Sort by createdAt desc
    usersWithStats.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST — Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 1. Zod input validation
    const validation = validateBody(userSchema, body);
    if (!validation.success) {
      console.error("Zod Validation Failed for User POST:", validation.errors, "Body received:", body);
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const { email, name, phone, location, role, brandLogo, brandFont, brandColor, editorRequirements } = validation.data;

    // 2. Check if user already exists in either client or partner DB
    let existingUser = await firestoreDb.clientUsers.findUnique({ where: { email } });
    if (!existingUser) {
      existingUser = await firestoreDb.partnerUsers.findUnique({ where: { email } });
    }

    if (existingUser) {
      return NextResponse.json(
        { user: existingUser },
        { status: 200 }
      );
    }

    const targetCol = role === "PARTNER" ? firestoreDb.partnerUsers : firestoreDb.clientUsers;

    const user = await targetCol.create({
      data: {
        email,
        name: name ?? null,
        phone: phone ?? null,
        location: location ?? null,
        role: role ?? "USER",
        brandLogo: brandLogo ?? null,
        brandFont: brandFont ?? null,
        brandColor: brandColor ?? null,
        editorRequirements: editorRequirements ?? null,
      },
    });

    // 3. Log audit event
    await logAudit({
      userId: user.id,
      action: "USER_SIGNUP",
      entity: "User",
      entityId: user.id,
      details: { email, role },
      req: request,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
