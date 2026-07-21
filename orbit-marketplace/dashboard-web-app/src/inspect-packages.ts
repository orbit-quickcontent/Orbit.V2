import { db } from './lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

async function inspect() {
  console.log("Fetching packages from Firestore...");
  const snap = await getDocs(collection(db, 'packages'));
  console.log(`Found ${snap.size} packages:`);
  snap.forEach((d) => {
    console.log(`ID: ${d.id}`, d.data());
  });
}

inspect().catch(console.error);
