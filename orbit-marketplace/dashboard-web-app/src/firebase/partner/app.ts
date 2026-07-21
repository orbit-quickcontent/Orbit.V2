import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFunctions } from "firebase/functions";

export const firebaseConfig = {
  apiKey: "AIzaSyA4QOCd8Ppfs8MVrmge7XDcrEEYok-jw4E",
  authDomain: "orbit-fs.firebaseapp.com",
  projectId: "orbit-fs",
  storageBucket: "orbit-fs.firebasestorage.app",
  messagingSenderId: "882668962125",
  appId: "1:882668962125:web:77b08714d1e309353f3704",
  measurementId: "G-32W5LLBYW5"
};

// Initialize or retrieve named Partner Firebase instance
export const app = getApps().find(a => a.name === "partner") || initializeApp(firebaseConfig, "partner");

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export const getAnalyticsInstance = async () => {
  if (typeof window !== "undefined" && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};
