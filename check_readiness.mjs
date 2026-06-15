import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: './admin-panel/admin/.env' });

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

const modulesToVerify = [
  'temples', 'poojas', 'priests', 'bookings', 'deliveries', 
  'recordings', 'liveStreams', 'users', 'queries', 'feedback', 
  'categories', 'festivals', 'languages'
];

async function runCheck() {
  const counts = {};
  for (const mod of modulesToVerify) {
    try {
      const snap = await getDocs(collection(db, mod));
      counts[mod] = snap.docs.length;
    } catch (e) {
      console.log(`Error checking ${mod}: ${e.message}`);
      counts[mod] = 0;
    }
  }

  let emptyModules = [];
  for (const [mod, count] of Object.entries(counts)) {
    if (count === 0) emptyModules.push(mod);
  }

  const result = {
    counts,
    emptyModules
  };

  fs.writeFileSync('readiness_data.json', JSON.stringify(result, null, 2));
  console.log('Readiness data generated.');
  process.exit(0);
}

runCheck();
