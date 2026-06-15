import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function checkDeliveries() {
  const templeId = "tmqar6jp5yk4t";
  console.log(`=== CHECKING DELIVERIES FOR TEMPLE ${templeId} ===\n`);
  
  const snapshot = await db.collection("deliveries").where("templeId", "==", templeId).get();
  console.log(`Found ${snapshot.size} deliveries for this temple.\n`);
  
  if (snapshot.size === 0) {
    console.log("Looking for a booking to generate a test delivery...");
    const bookingSnap = await db.collection("bookings")
      .where("templeId", "==", templeId)
      .where("bookingStatus", "==", "Confirmed")
      .limit(1).get();
      
    if (bookingSnap.empty) {
      console.log("No Confirmed bookings found for this temple to create a delivery from!");
    } else {
      const bDoc = bookingSnap.docs[0];
      const deliveryId = `DEL_${Date.now()}`;
      console.log(`Creating test delivery ${deliveryId} for booking ${bDoc.id}...`);
      
      await db.collection("deliveries").doc(deliveryId).set({
        deliveryId,
        bookingId: bDoc.id,
        templeId: templeId,
        status: "PACKED",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log("Test delivery created successfully.");
    }
  } else {
    snapshot.forEach(doc => {
      console.log(`Delivery ID: ${doc.id}, Status: ${doc.data().status}`);
    });
  }

  process.exit(0);
}

checkDeliveries().catch(console.error);
