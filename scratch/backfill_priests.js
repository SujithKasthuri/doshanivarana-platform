const admin = require('firebase-admin');

// Ensure you have your service account key available
// const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin (adjust credential logic as needed for your environment)
/*
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
*/

// If running in an environment where ADC (Application Default Credentials) is configured,
// you can simply use:
admin.initializeApp();

const db = admin.firestore();

async function backfillUnassignedPriests() {
  console.log("Starting backfill for Unassigned priests...");
  
  try {
    const priestsRef = db.collection('priests');
    const q = priestsRef.where('templeId', '==', 'Unassigned');
    const snapshot = await q.get();

    if (snapshot.empty) {
      console.log("No priests found with templeId = 'Unassigned'.");
      return;
    }

    console.log(`Found ${snapshot.size} priests to update. Processing...`);

    const batch = db.batch();
    
    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        templeId: 'tmqar6jp5yk4t',
        templeName: 'Sri Venkateswara Temple'
      });
      console.log(`Queued update for Priest ID: ${docSnap.id}`);
    });

    await batch.commit();
    console.log("Backfill completed successfully. All priests migrated.");
    
  } catch (error) {
    console.error("Error during backfill migration:", error);
  }
}

backfillUnassignedPriests();
