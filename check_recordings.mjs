import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// Load Firebase config
const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
const app = initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore(app);

async function checkRecordings() {
  console.log("=== CHECKING RECORDINGS COLLECTION ===\n");

  const snapshot = await db.collection("recordings").get();
  console.log(`Found ${snapshot.size} recordings.\n`);

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`  streamId: ${data.streamId}`);
    console.log(`  poojaName: ${data.poojaName}`);
    console.log(`  status: ${data.status}`);
    console.log(`  createdAt: ${data.createdAt ? data.createdAt.toDate() : 'none'}`);
    console.log("--------------------------------------------------");
  });

  process.exit(0);
}

checkRecordings().catch(console.error);
