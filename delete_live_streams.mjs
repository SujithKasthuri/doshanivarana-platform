import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: './admin-panel/admin/.env' });

const firebaseApp = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});

const db = getFirestore(firebaseApp);

async function deleteOldCollection() {
  const collectionRef = collection(db, 'live_streams');
  const snap = await getDocs(collectionRef);
  console.log(`Found ${snap.size} documents to delete in live_streams.`);
  
  let count = 0;
  for (const docSnap of snap.docs) {
    await deleteDoc(docSnap.ref);
    console.log(`Deleted ${docSnap.id}`);
    count++;
  }
  console.log(`Successfully deleted ${count} documents. Collection live_streams is now empty.`);
}

deleteOldCollection().catch(console.error);
