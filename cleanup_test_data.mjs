import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

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

async function runCleanup() {
  const readline = await import('readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('This script will hard-delete all TEST/MOCK/DELETED records from Firestore. Proceed? (y/N): ');
  rl.close();
  
  if (answer.toLowerCase() !== 'y') {
    console.log('Cleanup aborted.');
    process.exit(0);
  }

  const isDocMock = (docData, id) => {
    if (docData.isDeleted) return true;
    const isMock = Object.values(docData).some(v => 
      typeof v === 'string' && 
      (v.startsWith('TEST_') || v.startsWith('MOCK_') || v.startsWith('DEBUG_') || v.startsWith('TEMP_'))
    ) || id.startsWith('TEST_') || id.startsWith('MOCK_') || id.startsWith('temp') || id.startsWith('rec_') || id === 'tmqarauluy1f7';
    return isMock;
  };

  let deletedCount = 0;

  for (const collName of collections) {
    try {
      const snap = await getDocs(collection(db, collName));
      for (const d of snap.docs) {
        if (isDocMock(d.data(), d.id)) {
          await deleteDoc(doc(db, collName, d.id));
          console.log(`Deleted: ${collName}/${d.id}`);
          deletedCount++;
        }
      }
    } catch (e) {
      console.log(`Failed to process ${collName}: ${e.message}`);
    }
  }

  console.log(`Cleanup complete. Deleted ${deletedCount} documents.`);
  process.exit(0);
}

runCleanup();
