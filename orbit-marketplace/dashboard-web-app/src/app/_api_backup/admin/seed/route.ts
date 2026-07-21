import { NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";

const defaultPackages = [
  {
    id: "pkg-personalized",
    name: "Personalized",
    tier: "PERSONALIZED",
    price: 1999,
    focus: "Individual/Event cinematic reels",
    deliveryTime: "60-120 mins",
    features: [
      "Professional cinematic edit",
      "1 Reel (up to 60 sec)",
      "Color grading & transitions",
      "Background music sync",
      "60-120 min delivery",
      "1 revision round"
    ],
    popular: false
  },
  {
    id: "pkg-professional",
    name: "Professional (UGC)",
    tier: "PROFESSIONAL",
    price: 4999,
    focus: "Brand-focused storytelling with Brand DNA",
    deliveryTime: "60-120 mins",
    features: [
      "All Personalized features",
      "Brand DNA integration",
      "Logo/Font matching & Editor chat",
      "Up to 3 Reels (60 sec each)",
      "Multi-platform optimization",
      "2 revision rounds",
      "Priority editing queue"
    ],
    popular: true
  }
];

const defaultClientUser = {
  id: "usr-demo",
  email: "demo@orbitlogic.io",
  name: "Test User",
  phone: "+91 98765 43210",
  role: "USER",
  avatarType: "color",
  avatar: "from-orbit-cyan to-orbit-purple",
  isOnline: true
};

const defaultPartnerUsers = [
  {
    id: "usr-arjun",
    email: "arjun@orbitlogic.io",
    name: "Arjun Kapoor",
    phone: "+91 99999 88888",
    role: "PARTNER"
  },
  {
    id: "usr-priya",
    email: "priya@orbitlogic.io",
    name: "Priya Sharma",
    phone: "+91 99999 77777",
    role: "PARTNER"
  }
];

const defaultPartnerProfiles = [
  {
    id: "prt-arjun",
    userId: "usr-arjun",
    location: "Bandra West, Mumbai",
    latitude: 19.0596,
    longitude: 72.8295,
    availability: true,
    isVerified: true,
    rating: 4.9,
    completedProjects: 48,
    deviceInfo: "iPhone 15 Pro Max",
    walletBalance: 24500.0,
    pendingClearance: 4200.0,
    totalWithdrawn: 12000.0
  },
  {
    id: "prt-priya",
    userId: "usr-priya",
    location: "Andheri East, Mumbai",
    latitude: 19.1136,
    longitude: 72.8697,
    availability: true,
    isVerified: true,
    rating: 4.8,
    completedProjects: 32,
    deviceInfo: "Google Pixel 8 Pro",
    walletBalance: 16200.0,
    pendingClearance: 1900.0,
    totalWithdrawn: 8500.0
  }
];

export async function POST() {
  try {
    console.log("[API Seed] Seeding Firestore database...");

    // 1. Seed Packages
    for (const pkg of defaultPackages) {
      await firestoreDb.packages.create({ data: pkg });
    }

    // 2. Seed Client User
    await firestoreDb.clientUsers.create({ data: defaultClientUser });

    // 3. Seed Partner Users & Profiles
    for (const u of defaultPartnerUsers) {
      await firestoreDb.partnerUsers.create({ data: u });
    }
    for (const p of defaultPartnerProfiles) {
      await firestoreDb.partners.create({ data: p });
    }

    console.log("[API Seed] Database seeding completed successfully!");
    return NextResponse.json({ success: true, message: "Database seeded successfully!" });
  } catch (error: any) {
    console.error("[API Seed] Error during seeding:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Unknown error during seeding" },
      { status: 500 }
    );
  }
}
