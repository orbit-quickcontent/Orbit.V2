/**
 * Client Backend | User Handlers
 *
 * User management business logic using Firestore.
 * - GET  — List all users with booking counts
 * - POST — Create a new user (email required, unique)
 *
 * Re-exported by: src/app/api/users/route.ts
 */

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
import { supabase } from "@/lib/supabase-client";
import { validateBody, userSchema } from "@/lib/validation";
import { logAudit } from "@/lib/auth-server";

// GET — List users from Supabase profiles
export async function GET() {
  try {
    const { data: supaProfiles, error: supaErr } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!supaErr && supaProfiles && supaProfiles.length > 0) {
      const users = supaProfiles.map((p: any) => ({
        id: p.id,
        email: p.email,
        name: p.full_name,
        phone: p.phone,
        role: p.role ? p.role.toUpperCase() : 'USER',
        avatar: p.avatar_url || p.avatar_emoji || '👨🏻‍🦱',
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        totalBookings: 0,
      }));
      return NextResponse.json({ users });
    }

    // Fallback to Firestore safely
    try {
      const clientUsers = await firestoreDb.clientUsers.findMany();
      const partnerUsers = await firestoreDb.partnerUsers.findMany();
      const allUsers = [...clientUsers, ...partnerUsers];

      const usersWithStats = allUsers.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        location: user.location,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        totalBookings: 0,
      }));

      return NextResponse.json({ users: usersWithStats });
    } catch (fsErr) {
      return NextResponse.json({ users: [] });
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ users: [] });
  }
}

// POST — Create/Sync user in Supabase Postgres
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 1. Zod input validation
    const validation = validateBody(userSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const { email, name, phone, location, role, brandLogo, brandFont, brandColor, editorRequirements } = validation.data;

    // 2. Sync profile into Supabase Postgres
    const supaRole = role === 'PARTNER' ? 'partner' : 'client';
    const { data: profile, error: supaErr } = await supabase
      .from('profiles')
      .upsert({
        full_name: name || email.split('@')[0],
        name: name || email.split('@')[0],
        email: email,
        phone: phone || null,
        role: supaRole,
      }, { onConflict: 'email' })
      .select()
      .single();

    if (!supaErr && profile) {
      console.log('[Supabase User POST] Synced profile:', profile.id, profile.email);
      return NextResponse.json({ user: { id: profile.id, email: profile.email, name: profile.full_name, role: profile.role } }, { status: 200 });
    }

    // 3. Fallback/Sync with Firestore safely
    try {
      let existingUser = await firestoreDb.clientUsers.findUnique({ where: { email } });
      if (!existingUser) {
        existingUser = await firestoreDb.partnerUsers.findUnique({ where: { email } });
      }

      if (existingUser) {
        return NextResponse.json({ user: existingUser }, { status: 200 });
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

      await logAudit({
        userId: user.id,
        action: "USER_SIGNUP",
        entity: "User",
        entityId: user.id,
        details: { email, role },
        req: request,
      });
      return NextResponse.json({ user }, { status: 201 });
    } catch (fsErr) {
      return NextResponse.json({ user: { id: profile?.id || email, email, name, role } }, { status: 200 });
    }
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user", details: error.message },
      { status: 500 }
    );
  }
}
