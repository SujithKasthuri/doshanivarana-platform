import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

const serviceAccountPath = path.resolve('c:/Users/Asus/.gemini/antigravity/scratch/doshanivarana-platform/admin-panel/admin/service-account.json');
initializeApp({
  credential: cert(require(serviceAccountPath)),
  projectId: 'dosha-nivarana-dev'
});

const db = getFirestore();

async function run() {
  const b1 = await db.collection('bookings').doc('BK_1781503165326').get();
  const b2 = await db.collection('bookings').doc('BK_1781505207934').get();
  
  console.log("Booking 1:", b1.data());
  console.log("Booking 2:", b2.data());

  const slots = await db.collection('slots').get();
  slots.forEach(s => console.log("Slot:", s.id, s.data()));
}

run().catch(console.error);
