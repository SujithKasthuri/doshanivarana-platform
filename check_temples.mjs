import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: './admin-panel/admin/.env' });

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

async function checkTemples() {
  const snapshot = await getDocs(collection(db, 'temples'));
  const ids = snapshot.docs.map(doc => doc.id);
  console.log("Temple IDs found:", ids);
  process.exit();
}
checkTemples();
