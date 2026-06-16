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

async function listUsers() {
  const usersSnap = await getDocs(collection(db, 'users'));
  usersSnap.forEach(d => console.log(d.id, d.data().email, d.data().role));
  process.exit(0);
}
listUsers();
