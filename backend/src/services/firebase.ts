import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAnBPU5tA4vLl2zzGlFUx8-kwSNtt54xMc",
  authDomain: "orbit-99e42.firebaseapp.com",
  projectId: "orbit-99e42",
  storageBucket: "orbit-99e42.firebasestorage.app",
  messagingSenderId: "1086714107107",
  appId: "1:1086714107107:web:b7290d871b28f8403761d6"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
