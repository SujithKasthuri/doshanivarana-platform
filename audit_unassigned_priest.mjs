import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: './admin-panel/admin/.env' });

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

async function runAudit() {
  // Step 2: Manually patch the PRO user
  const userId = 'lHh2PvlS4sQ5TkAgkWVt91FpU393';
  try {
    await updateDoc(doc(db, 'users', userId), { templeId: 'tmqar6jp5yk4t' });
    console.log(`[PATCH SUCCESS] PRO User ${userId} templeId -> tmqar6jp5yk4t`);
  } catch(e) {
    console.log(`[PATCH ERROR] Failed to patch PRO user: ${e.message}`);
  }

  // Step 3: Audit remaining priest
  let unassignedPriest = null;
  const priestsSnap = await getDocs(collection(db, 'priests'));
  priestsSnap.docs.forEach(d => {
    if (d.data().templeId === 'Unassigned') {
      unassignedPriest = { id: d.id, ...d.data() };
    }
  });

  if (!unassignedPriest) {
    console.log('No unassigned priest found.');
    process.exit(0);
  }

  console.log(`\n--- PRIEST AUDIT ---`);
  console.log(`Priest ID: ${unassignedPriest.id}`);
  console.log(`Name: ${unassignedPriest.name}`);
  console.log(`Created At: ${unassignedPriest.createdAt}`);

  // Find likely mapping by looking at slots/bookings
  const slotsSnap = await getDocs(collection(db, 'slots'));
  const bookingsSnap = await getDocs(collection(db, 'bookings'));
  
  const templeVotes = {};
  slotsSnap.docs.forEach(d => {
    const data = d.data();
    if (data.priestId === unassignedPriest.id && data.templeId) {
      templeVotes[data.templeId] = (templeVotes[data.templeId] || 0) + 1;
    }
  });
  bookingsSnap.docs.forEach(d => {
    const data = d.data();
    if (data.priestId === unassignedPriest.id && data.templeId) {
      templeVotes[data.templeId] = (templeVotes[data.templeId] || 0) + 1;
    }
  });

  let likelyTemple = 'None found';
  let maxVotes = 0;
  for (const [tId, votes] of Object.entries(templeVotes)) {
    if (votes > maxVotes) {
      maxVotes = votes;
      likelyTemple = tId;
    }
  }

  console.log(`Likely Temple Mapping: ${likelyTemple} (${maxVotes} supporting records)`);
  
  if (likelyTemple !== 'None found') {
    // Step 4: Patch the priest
    console.log(`\nPatching priest to likely temple: ${likelyTemple}...`);
    try {
      await updateDoc(doc(db, 'priests', unassignedPriest.id), { templeId: likelyTemple });
      console.log(`[PATCH SUCCESS] Priest ${unassignedPriest.id} templeId -> ${likelyTemple}`);
    } catch(e) {
      console.log(`[PATCH ERROR] Failed to patch Priest: ${e.message}`);
    }
  } else {
    console.log('\nCould not automatically deduce priest temple. Patch manually required.');
  }

  process.exit(0);
}

runAudit();
