import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: './admin-panel/admin/.env' });

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

async function runRestore() {
  const readline = await import('readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('WARNING: This will overwrite Firestore with data from firestore_backup.json. Proceed? (y/N): ');
  rl.close();
  
  if (answer.toLowerCase() !== 'y') {
    console.log('Restore aborted.');
    process.exit(0);
  }

  if (!fs.existsSync('firestore_backup.json')) {
    console.log('Error: firestore_backup.json not found.');
    process.exit(1);
  }

  console.log('Starting restore...');
  const backupData = JSON.parse(fs.readFileSync('firestore_backup.json', 'utf8'));
  let totalRestored = 0;

  for (const collName of Object.keys(backupData)) {
    const docs = backupData[collName];
    for (const docId of Object.keys(docs)) {
      try {
        await setDoc(doc(db, collName, docId), docs[docId]);
        totalRestored++;
      } catch (e) {
        console.log(`Failed to restore ${collName}/${docId}: ${e.message}`);
      }
    }
    console.log(`Restored ${Object.keys(docs).length} documents to ${collName}`);
  }

  console.log(`\nRestore complete. Restored ${totalRestored} documents.`);
  process.exit(0);
}

runRestore();
