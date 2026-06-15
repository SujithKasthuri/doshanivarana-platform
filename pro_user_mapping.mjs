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

async function runMappingAudit() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const templesSnap = await getDocs(collection(db, 'temples'));

  const temples = templesSnap.docs.map(t => ({ id: t.id, ...t.data() }));
  
  let targetUser = null;
  usersSnap.docs.forEach(u => {
    const data = u.data();
    if (data.templeId === 'temple_001') {
      targetUser = { id: u.id, ...data };
    }
  });

  let md = '# PRO User Temple Mapping Audit\n\n';

  if (!targetUser) {
    md += 'User with `templeId = "temple_001"` not found.\n';
  } else {
    md += '## User Details\n';
    md += `- **Document ID**: \`${targetUser.id}\`\n`;
    md += `- **Name**: ${targetUser.name || 'N/A'}\n`;
    md += `- **Email**: ${targetUser.email || 'N/A'}\n`;
    md += `- **Role**: ${targetUser.role || 'N/A'}\n`;
    md += `- **Created By**: ${targetUser.createdBy || 'N/A'}\n\n`;

    md += '## Active Temples\n';
    temples.forEach(t => {
      md += `- **ID**: \`${t.id}\` | **Name**: ${t.name || 'Unnamed Temple'}\n`;
    });

    md += '\n## Recommendation\n';
    // Let's attempt a heuristic
    let recommendedTempleId = null;
    let recommendedTempleName = '';
    
    temples.forEach(t => {
      if (t.name && targetUser.name && t.name.toLowerCase().includes(targetUser.name.toLowerCase().split(' ')[0])) {
        recommendedTempleId = t.id;
        recommendedTempleName = t.name;
      }
    });

    if (recommendedTempleId) {
      md += `Based on name/email heuristics, the recommended mapping is **${recommendedTempleName}** (\`${recommendedTempleId}\`).\n`;
    } else {
      md += `No exact heuristic match found. Please review the Active Temples list above to map ${targetUser.name || targetUser.email} manually.\n`;
    }
  }

  fs.writeFileSync('C:/Users/Asus/.gemini/antigravity/brain/bfe90b01-f7e2-4766-b6a5-dafd1eadb255/pro_user_mapping_recommendation.md', md);
  console.log('Mapping audit complete.');
  process.exit(0);
}

runMappingAudit();
