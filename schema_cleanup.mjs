import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteField } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: './admin-panel/admin/.env' });

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

async function runSchemaCleanup() {
  const readline = await import('readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('This script will remove deprecated fields from temples, poojas, and slots. Proceed? (y/N): ');
  rl.close();
  
  if (answer.toLowerCase() !== 'y') {
    console.log('Schema cleanup aborted.');
    process.exit(0);
  }

  let cleanedCount = 0;

  try {
    // Temples
    const templesSnap = await getDocs(collection(db, 'temples'));
    for (const d of templesSnap.docs) {
      const data = d.data();
      const updates = {};
      if (data.type !== undefined) updates.type = deleteField();
      if (data.revenue !== undefined) updates.revenue = deleteField();
      if (data.proManagerName !== undefined) updates.proManagerName = deleteField();
      
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'temples', d.id), updates);
        console.log(`Cleaned schema for temples/${d.id}`);
        cleanedCount++;
      }
    }

    // Poojas
    const poojasSnap = await getDocs(collection(db, 'poojas'));
    for (const d of poojasSnap.docs) {
      const data = d.data();
      const updates = {};
      if (data.liveStream !== undefined) updates.liveStream = deleteField();
      if (data.prasad !== undefined) updates.prasad = deleteField();
      if (data.rating !== undefined) updates.rating = deleteField();
      if (data.templesCount !== undefined) updates.templesCount = deleteField();
      
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'poojas', d.id), updates);
        console.log(`Cleaned schema for poojas/${d.id}`);
        cleanedCount++;
      }
    }

    // Slots
    const slotsSnap = await getDocs(collection(db, 'slots'));
    for (const d of slotsSnap.docs) {
      const data = d.data();
      const updates = {};
      if (data.bookedCount !== undefined) updates.bookedCount = deleteField();
      
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'slots', d.id), updates);
        console.log(`Cleaned schema for slots/${d.id}`);
        cleanedCount++;
      }
    }

  } catch (e) {
    console.log(`Failed to process schema cleanup: ${e.message}`);
  }

  console.log(`Schema cleanup complete. Updated ${cleanedCount} documents.`);
  process.exit(0);
}

runSchemaCleanup();
