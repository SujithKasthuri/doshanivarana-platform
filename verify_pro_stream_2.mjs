import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function verify() {
  const adminStreams = await db.collection('liveStreams').get();
  adminStreams.forEach(doc => {
    console.log(doc.id, doc.data().status, doc.data().actualEndTime, doc.data().endedAt);
  });
  process.exit(0);
}

verify();
