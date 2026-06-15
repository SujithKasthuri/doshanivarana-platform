import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: './admin-panel/admin/.env' });

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

async function runAudit() {
  console.log("Fetching Temples...");
  const templesSnap = await getDocs(collection(db, 'temples'));
  const validTempleIds = new Set(templesSnap.docs.map(doc => doc.id));
  
  console.log("Fetching PRO Users...");
  const q = query(collection(db, 'users'), where('role', '==', 'PRO'));
  const prosSnap = await getDocs(q);
  
  const pros = prosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  let totalPros = pros.length;
  let validRefs = 0;
  let invalidRefs = 0;
  
  let invalidDetails = [];
  
  for (const pro of pros) {
    if (validTempleIds.has(pro.templeId)) {
      validRefs++;
    } else {
      invalidRefs++;
      invalidDetails.push({
        uid: pro.id,
        name: pro.name,
        email: pro.email,
        invalidTempleId: pro.templeId
      });
    }
  }
  
  const report = `# Relationship Integrity Report
  
## Summary
- **Total PRO Users**: ${totalPros}
- **Valid Temple References**: ${validRefs}
- **Invalid Temple References**: ${invalidRefs}

## Invalid References Details
${invalidDetails.length === 0 ? "No invalid references found! All PRO users are linked to a real temple." : 
  invalidDetails.map(d => `- **User**: ${d.name} (${d.email}) | **Invalid ID**: \`${d.invalidTempleId}\``).join('\n')
}
`;

  fs.writeFileSync('integrity_report.md', report);
  console.log("Audit complete. Report written to integrity_report.md");
  process.exit();
}

runAudit();
