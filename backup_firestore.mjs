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

const collections = [
  'auditLogs', 'bookings', 'payments', 'deliveries', 'refunds', 'notifications', 
  'feedback', 'festivals', 'liveStreams', 'recordings', 'poojas', 'priests', 
  'slots', 'systemEvents', 'temples', 'users', 'temple_requests', 'queries', 
  'campaigns', 'categories', 'languages'
];

async function runBackup() {
  const readline = await import('readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('This will backup Firestore to firestore_backup.json. Proceed? (y/N): ');
  rl.close();
  
  if (answer.toLowerCase() !== 'y') {
    console.log('Backup aborted.');
    process.exit(0);
  }

  console.log('Starting backup...');
  const backupData = {};
  let totalDocs = 0;

  for (const collName of collections) {
    try {
      const snap = await getDocs(collection(db, collName));
      backupData[collName] = {};
      snap.docs.forEach(doc => {
        backupData[collName][doc.id] = doc.data();
        totalDocs++;
      });
      console.log(`Backed up ${snap.size} documents from ${collName}`);
    } catch (e) {
      console.log(`Failed to fetch ${collName}: ${e.message}`);
    }
  }

  fs.writeFileSync('firestore_backup.json', JSON.stringify(backupData, null, 2));
  console.log(`\nBackup complete. Saved ${totalDocs} documents to firestore_backup.json`);
  process.exit(0);
}

runBackup();
