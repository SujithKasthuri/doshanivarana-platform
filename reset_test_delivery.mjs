import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function resetDelivery() {
  const templeId = "tmqar6jp5yk4t";
  console.log(`=== RESETTING TEST DELIVERY ===\n`);
  
  const snapshot = await db.collection("deliveries").where("templeId", "==", templeId).get();
  
  for (const doc of snapshot.docs) {
    console.log(`Resetting delivery ${doc.id} back to 'Booked' status...`);
    await db.collection("deliveries").doc(doc.id).update({
      status: "Booked",
      weight: "",
      length: "",
      width: "",
      height: "",
      contents: ""
    });
    console.log(`Delivery ${doc.id} successfully reset!`);
  }

  process.exit(0);
}

resetDelivery().catch(console.error);
