import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA4QOCd8Ppfs8MVrmge7XDcrEEYok-jw4E",
  authDomain: "orbit-fs.firebaseapp.com",
  projectId: "orbit-fs",
  storageBucket: "orbit-fs.firebasestorage.app",
  messagingSenderId: "882668962125",
  appId: "1:882668962125:web:c31d0312af94549b3f3704"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
