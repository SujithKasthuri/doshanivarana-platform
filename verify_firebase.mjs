import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function verifyConnection(envPath, appName) {
  dotenv.config({ path: envPath, override: true });

  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
  };

  if (!firebaseConfig.apiKey) {
    console.error(`[${appName}] Verification Skipped: Firebase configuration not found in ${envPath}. Please fill in the .env file.`);
    return;
  }

  console.log(`\n--- Verifying ${appName} ---`);
  try {
    const app = initializeApp(firebaseConfig, appName);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log(`[${appName}] Auth Initialized:`, auth ? 'Success' : 'Failed');

    // Test Firestore
    const testCollection = collection(db, 'connection_tests');
    const docRef = await addDoc(testCollection, {
      timestamp: serverTimestamp(),
      source: appName
    });
    console.log(`[${appName}] Firestore Write: Success (Doc ID: ${docRef.id})`);
    
    await deleteDoc(docRef);
    console.log(`[${appName}] Firestore Delete: Success`);
    
    console.log(`[${appName}] Overall Connection: Verified\n`);
  } catch (error) {
    console.error(`[${appName}] Connection Error:`, error);
  }
}

async function run() {
  await verifyConnection(resolve(__dirname, 'admin-panel/admin/.env'), 'AdminPanel');
  await verifyConnection(resolve(__dirname, 'pro-panel/.env'), 'ProPanel');
  process.exit(0);
}

run();
