import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: './admin-panel/admin/.env' });

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

async function runReferencePatch() {
  const readline = await import('readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('This script will nullify invalid templeId references in users and priests. Proceed? (y/N): ');
  rl.close();
  
  if (answer.toLowerCase() !== 'y') {
    console.log('Reference patch aborted.');
    process.exit(0);
  }

  let patchedCount = 0;

  try {
    const templesSnap = await getDocs(collection(db, 'temples'));
    const validTemples = new Set(templesSnap.docs.map(d => d.id));

    // Patch Users
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const d of usersSnap.docs) {
      const data = d.data();
      if (data.templeId && !validTemples.has(data.templeId)) {
        await updateDoc(doc(db, 'users', d.id), { templeId: null });
        console.log(`Patched users/${d.id}`);
        patchedCount++;
      }
    }

    // Patch Priests
    const priestsSnap = await getDocs(collection(db, 'priests'));
    for (const d of priestsSnap.docs) {
      const data = d.data();
      if (data.templeId && !validTemples.has(data.templeId)) {
        await updateDoc(doc(db, 'priests', d.id), { templeId: null });
        console.log(`Patched priests/${d.id}`);
        patchedCount++;
      }
    }

  } catch (e) {
    console.log(`Failed to process reference patch: ${e.message}`);
  }

  console.log(`Reference patch complete. Patched ${patchedCount} documents.`);
  process.exit(0);
}

runReferencePatch();
