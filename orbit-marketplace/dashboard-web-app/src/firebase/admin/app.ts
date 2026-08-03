import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFunctions } from "firebase/functions";

export const firebaseConfig = {
  apiKey: "AIzaSyAnBPU5tA4vLl2zzGlFUx8-kwSNtt54xMc",
  authDomain: "orbit-99e42.firebaseapp.com",
  projectId: "orbit-99e42",
  storageBucket: "orbit-99e42.firebasestorage.app",
  messagingSenderId: "1086714107107",
  appId: "1:1086714107107:web:b7290d871b28f8403761d6",
  measurementId: "G-NFMNTH1T1J"
};

// Initialize or retrieve named Admin Firebase instance
export const app = getApps().find(a => a.name === "admin") || initializeApp(firebaseConfig, "admin");

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
