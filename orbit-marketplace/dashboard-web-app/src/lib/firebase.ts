import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Config templates for Orbit project 'orbit-99e42'
const baseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAnBPU5tA4vLl2zzGlFUx8-kwSNtt54xMc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "orbit-99e42.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "orbit-99e42",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "orbit-99e42.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1086714107107",
};

const adminConfig = {
  ...baseConfig,
  appId: "1:1086714107107:web:b7290d871b28f8403761d6",
  measurementId: "G-NFMNTH1T1J"
};

const clientConfig = {
  ...baseConfig,
  appId: "1:1086714107107:web:b7290d871b28f8403761d6",
  measurementId: "G-NFMNTH1T1J"
};

const editorConfig = {
  ...baseConfig,
  appId: "1:1086714107107:web:a8f6c6df018ebb123761d6",
  measurementId: "G-ZH3MP0ZYJ8"
};

const partnerConfig = {
  ...baseConfig,
  appId: "1:1086714107107:web:b7290d871b28f8403761d6",
  measurementId: "G-NFMNTH1T1J"
};

// Dynamically select the configuration based on the browser url / user role context
let firebaseConfig = adminConfig; // Default to admin for SSR / backend node environment

if (typeof window !== "undefined") {
  const url = window.location.href;
  if (url.includes("role=PARTNER") || url.includes("/partner")) {
    firebaseConfig = partnerConfig;
  } else if (url.includes("role=USER") || url.includes("/client")) {
    firebaseConfig = clientConfig;
  } else if (url.includes("/admin")) {
    firebaseConfig = adminConfig;
  } else if (window.location.port === "3001" || url.includes("editor")) {
    firebaseConfig = editorConfig;
  } else {
    firebaseConfig = clientConfig; // Default to client app
  }
}

// Initialize Firebase (SSR Safe)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics (SSR Safe)
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, analytics };
