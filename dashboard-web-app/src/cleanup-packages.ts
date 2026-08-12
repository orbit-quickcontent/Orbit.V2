import { db } from './lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

async function cleanup() {
  console.log("Fetching packages from Firestore to delete...");
  const snap = await getDocs(collection(db, 'packages'));
  console.log(`Deleting ${snap.size} packages...`);
  
  const promises = snap.docs.map((d) => {
    console.log(`Deleting ID: ${d.id}`);
    return deleteDoc(doc(db, 'packages', d.id));
  });
  
  await Promise.all(promises);
  console.log("Cleanup complete!");
}

cleanup().catch(console.error);
