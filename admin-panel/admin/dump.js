import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as url from 'url';
import fs from 'fs';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, 'service-account.json');
initializeApp({
  credential: cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))),
  projectId: 'dosha-nivarana-dev'
});

const db = getFirestore();

async function run() {
  const b1 = await db.collection('bookings').doc('BK_1781503165326').get();
  const b2 = await db.collection('bookings').doc('BK_1781505207934').get();
  
  console.log("Booking 1:", b1.data());
  console.log("Booking 2:", b2.data());

  const slots = await db.collection('slots').where('poojaName', '==', 'Rudhraabhishekam').get();
  if (slots.empty) {
     const slots2 = await db.collection('slots').where('poojaId', '==', 'pooja_rudhraabhishekam').get(); // guess
     slots2.forEach(s => console.log("Slot:", s.id, s.data()));
  } else {
     slots.forEach(s => console.log("Slot:", s.id, s.data()));
  }
}

run().catch(console.error);
