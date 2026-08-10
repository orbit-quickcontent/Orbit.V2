import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAnBPU5tA4vLl2zzGlFUx8-kwSNtt54xMc",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "orbit-99e42.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "orbit-99e42",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "orbit-99e42.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "1086714107107",
  appId: process.env.FIREBASE_APP_ID || "1:1086714107107:web:b7290d871b28f8403761d6"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch (e) {
  db = getFirestore(app);
}

const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, db, storage };
