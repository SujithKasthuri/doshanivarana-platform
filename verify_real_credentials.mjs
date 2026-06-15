import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, limit, query, where, addDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load admin .env
dotenv.config({ path: resolve('./admin-panel/admin/.env'), override: true });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

async function runVerification() {
  console.log("1. Starting Firebase Initialization...");
  try {
    const app = initializeApp(firebaseConfig);
    console.log("✅ App initialized successfully.");

    const auth = getAuth(app);
    console.log("✅ Auth module loaded.");
    
    console.log("\n2. Attempting authentication...");
    let uid;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, 'admin@doshanivarana.com', 'adminPassword123!');
      uid = userCredential.user.uid;
      console.log(`✅ Authentication successful! Logged in as: ${userCredential.user.email}`);

      // Read current Firebase Auth token custom claims
      const tokenResult = await userCredential.user.getIdTokenResult(true);
      console.log("\n--- Decoded Custom Claims ---");
      console.log(JSON.stringify(tokenResult.claims, null, 2));
      console.log("-----------------------------\n");
      
      console.log(`Verifying ID: ${uid}`);
      console.log(`Role: ${tokenResult.claims.role}`);
      console.log(`Temple ID: ${tokenResult.claims.templeId}`);

    } catch (authErr) {
      console.log("❌ Authentication failed. Is the admin account created in this Firebase project?");
      throw authErr;
    }
    
    const db = getFirestore(app);
    console.log("✅ Firestore module loaded.");

    console.log("\n3. Attempting test write to Firestore (Temples Collection)...");
    const testDocId = `test_temple_${Date.now()}`;
    const templesRef = collection(db, 'temples');
    
    // Admin should have write access
    await addDoc(templesRef, {
      name: "Connection Test Temple",
      isTest: true,
      isActive: true,
      isDeleted: false,
      createdAt: new Date().toISOString()
    });
    
    console.log(`✅ Successfully wrote test document.`);

    console.log("\n🎉 All verifications passed successfully! No invalid-api-key errors.");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Verification Failed:");
    console.error(error);
    process.exit(1);
  }
}

runVerification();
