import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA4QOCd8Ppfs8MVrmge7XDcrEEYok-jw4E",
  authDomain: "orbit-fs.firebaseapp.com",
  projectId: "orbit-fs",
  storageBucket: "orbit-fs.firebasestorage.app",
  messagingSenderId: "882668962125",
  appId: "1:882668962125:web:c31d0312af94549b3f3704" // Admin config
};

console.log("[Firestore Seeder] Initializing Firebase connection to 'orbit-fs'...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Data payloads
const packages = [
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

const clientUser = {
  id: "usr-demo",
  email: "demo@orbitlogic.io",
  name: "Test User",
  phone: "+91 98765 43210",
  role: "USER",
  avatarType: "color",
  avatar: "from-orbit-cyan to-orbit-purple",
  isOnline: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const partnerUsers = [
  {
    id: "usr-arjun",
    email: "arjun@orbitlogic.io",
    name: "Arjun Kapoor",
    phone: "+91 99999 88888",
    role: "PARTNER",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "usr-priya",
    email: "priya@orbitlogic.io",
    name: "Priya Sharma",
    phone: "+91 99999 77777",
    role: "PARTNER",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const partnerProfiles = [
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
    totalWithdrawn: 12000.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
    totalWithdrawn: 8500.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function runSeeder() {
  try {
    // 1. Seed packages
    console.log("[Firestore Seeder] Seeding 'packages' collection...");
    for (const pkg of packages) {
      await setDoc(doc(db, "packages", pkg.id), pkg);
      console.log(` - Created package: ${pkg.name}`);
    }

    // 2. Seed client users
    console.log("[Firestore Seeder] Seeding 'client_users' collection...");
    await setDoc(doc(db, "client_users", clientUser.id), clientUser);
    console.log(` - Created client user: ${clientUser.email}`);

    // 3. Seed partner users & profiles
    console.log("[Firestore Seeder] Seeding 'partner_users' and 'partner_profiles'...");
    for (const pu of partnerUsers) {
      await setDoc(doc(db, "partner_users", pu.id), pu);
      console.log(` - Created partner user: ${pu.email}`);
    }
    for (const pp of partnerProfiles) {
      await setDoc(doc(db, "partner_profiles", pp.id), pp);
      console.log(` - Created partner profile: ${pp.id}`);
    }

    console.log("[Firestore Seeder] Seeding completed successfully! Orbit database is now initialized in your Firestore.");
    process.exit(0);
  } catch (error) {
    console.error("[Firestore Seeder] Error seeding database:", error);
    process.exit(1);
  }
}

runSeeder();
