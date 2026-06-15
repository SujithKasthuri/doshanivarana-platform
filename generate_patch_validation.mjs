import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: './admin-panel/admin/.env' });

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

const collections = ['bookings', 'users', 'temples', 'priests'];

async function runPatchValidation() {
  const data = {};
  
  for (const collName of collections) {
    try {
      const snap = await getDocs(collection(db, collName));
      data[collName] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.log(`Failed to fetch ${collName}: ${e.message}`);
    }
  }

  const validTemples = new Set((data['temples'] || []).map(t => t.id));
  const validUsers = new Set((data['users'] || []).map(u => u.id));

  let md = '# Reference Patch Validation\n\n';

  const checkRef = (colName, docs, field, targetColName, validTargetIds) => {
    docs.forEach(doc => {
      const val = doc[field];
      if (val !== undefined && val !== null && val !== '') {
        if (!validTargetIds.has(val)) {
          let reason = val === 'GUEST' || val.startsWith('temp') || val === 'Unassigned' ? 'Placeholder/String used instead of proper ID' : 'Referenced document was deleted or never existed';
          let patchTo = val === 'GUEST' ? 'null (or migrate to a universal GUEST user record)' : 'null';
          let businessImpact = '';
          let risk = 'MEDIUM';

          if (colName === 'bookings' && field === 'userId') {
            businessImpact = '- Admin affected: Minor (booking details might not load user info)\\n- PRO affected: Minor\\n- User App affected: Yes, user cannot see their booking history';
            risk = 'HIGH';
            patchTo = 'null (Warning: changing this to null might break app logic expecting a string "GUEST")';
          } else if (colName === 'users' && field === 'templeId') {
            businessImpact = '- Admin affected: None\\n- PRO affected: Yes, PRO user cannot see their temple dashboard\\n- User App affected: None';
            risk = 'HIGH';
          } else if (colName === 'priests' && field === 'templeId') {
            businessImpact = '- Admin affected: Yes, priest might not show up under temple\\n- PRO affected: Yes, cannot schedule priest\\n- User App affected: None directly';
            risk = 'MEDIUM';
          }

          md += `**Collection**: ${colName}\n`;
          md += `**Document ID**: \`${doc.id}\`\n`;
          md += `**Field**: \`${field}\`\n`;
          md += `**Current Value**: \`${val}\`\n`;
          md += `**Referenced Collection**: ${targetColName}\n`;
          md += `**Reason It Is Broken**: ${reason}\n\n`;
          
          md += `**Will be patched to**: \`${patchTo}\`\n\n`;
          
          md += `**Business Impact**:\n${businessImpact.split('\\n').join('\n')}\n\n`;
          md += `**Risk Level**: ${risk}\n\n`;
          md += `---\n\n`;
        }
      }
    });
  };

  checkRef('bookings', data['bookings'] || [], 'userId', 'users', validUsers);
  checkRef('users', data['users'] || [], 'templeId', 'temples', validTemples);
  checkRef('priests', data['priests'] || [], 'templeId', 'temples', validTemples);

  fs.writeFileSync('C:/Users/Asus/.gemini/antigravity/brain/bfe90b01-f7e2-4766-b6a5-dafd1eadb255/reference_patch_validation.md', md);
  console.log('Patch validation generated.');
  process.exit(0);
}

runPatchValidation();
