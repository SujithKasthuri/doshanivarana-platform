import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function inspectRecordings() {
  console.log("=== INSPECTING RECORDINGS ===\n");
  const snapshot = await db.collection("recordings").get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.poojaName === "Unknown Pooja" || !data.poojaName) {
      console.log(`FOUND TARGET RECORDING: ${doc.id}`);
      console.log(`Data:`, JSON.stringify(data, null, 2));
      
      if (data.bookingId) {
        const bookingSnap = await db.collection("bookings").doc(data.bookingId).get();
        if (bookingSnap.exists) {
           console.log(`\nLinked Booking (${data.bookingId}) Data:`, JSON.stringify(bookingSnap.data(), null, 2));
        } else {
           console.log(`\nLinked Booking (${data.bookingId}) NOT FOUND.`);
        }
      }
      console.log("--------------------------------------------------");
    }
  }

  process.exit(0);
}

inspectRecordings().catch(console.error);
