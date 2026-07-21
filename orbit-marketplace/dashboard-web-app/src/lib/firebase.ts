import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Config templates for the different Orbit app contexts under the 'orbit-fs' project
const baseConfig = {
  apiKey: "AIzaSyA4QOCd8Ppfs8MVrmge7XDcrEEYok-jw4E",
  authDomain: "orbit-fs.firebaseapp.com",
  projectId: "orbit-fs",
  storageBucket: "orbit-fs.firebasestorage.app",
  messagingSenderId: "882668962125",
};

const adminConfig = {
  ...baseConfig,
  appId: "1:882668962125:web:c31d0312af94549b3f3704",
  measurementId: "G-WZQTPZZRHW"
};

const clientConfig = {
  ...baseConfig,
  appId: "1:882668962125:web:01195c29c9fa39013f3704",
  measurementId: "G-E0CJ1KVC7F"
};

const editorConfig = {
  ...baseConfig,
  appId: "1:882668962125:web:b568464e2faea92c3f3704",
  measurementId: "G-T4X14EVQW0"
};

const partnerConfig = {
  ...baseConfig,
  appId: "1:882668962125:web:77b08714d1e309353f3704",
  measurementId: "G-32W5LLBYW5"
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
