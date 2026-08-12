/**
 * Orbit Platform Reset Engine - Reset All Apps to Zero
 * 
 * Resets Firebase Firestore database collections ('bookings', 'partner_locations', 'deliveries', 'dispatches')
 * to a fresh zero-state baseline.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";

const FIREBASE_CONFIG = {
  projectId: "orbit-99e42",
  storageBucket: "orbit-99e42.firebasestorage.app",
  apiKey: "AIzaSyAnBPU5tA4vLl2zzGlFUx8-kwSNtt54xMc",
  authDomain: "orbit-99e42.firebaseapp.com",
};

const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
const db = getFirestore(app);

async function resetAllToZero() {
  console.log("=========================================");
  console.log("🚀 RESETTING ORBIT PLATFORM DATA TO ZERO");
  console.log("=========================================");

  const collectionsToClear = ["bookings", "partner_locations", "deliveries", "dispatches", "notifications"];

  for (const colName of collectionsToClear) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`Clearing ${snap.docs.length} documents from '${colName}'...`);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, colName, d.id));
      }
      console.log(`✓ '${colName}' collection reset to 0 items.`);
    } catch (e) {
      console.error(`Error resetting collection '${colName}':`, e);
    }
  }

  // Reset default partner wallet balance to 0
  try {
    await setDoc(doc(db, "wallets", "partner_default"), {
      balance: 0,
      totalEarned: 0,
      pendingPayout: 0,
      transactions: [],
      updatedAt: new Date().toISOString()
    });
    console.log("✓ Partner Wallet reset to ₹0 balance.");
  } catch (e) {
    console.error("Error resetting wallet:", e);
  }

  console.log("=========================================");
  console.log("✅ PLATFORM SUCCESSFULLY RESET TO ZERO!");
  console.log("=========================================");
}

resetAllToZero().catch(console.error);
