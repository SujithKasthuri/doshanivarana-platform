import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: './admin-panel/admin/.env' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runTest() {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, 'admin@doshanivarana.com', 'adminPassword123!');
    const tokenResult = await userCredential.user.getIdTokenResult(true);
    
    console.log("--- Token Claims ---");
    console.log(JSON.stringify(tokenResult.claims, null, 2));
    
    console.log("\nAttempting to write to /permission_test...");
    const testRef = collection(db, 'permission_test');
    await addDoc(testRef, {
      test: true,
      createdAt: serverTimestamp()
    });
    
    console.log("Write Succeeded!");
  } catch (error) {
    console.error("Write Failed!");
    console.error(error);
  } finally {
    process.exit();
  }
}

runTest();
