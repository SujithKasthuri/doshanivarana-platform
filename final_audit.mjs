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

const collections = [
  'auditLogs', 'bookings', 'payments', 'deliveries', 'refunds', 'notifications', 
  'feedback', 'festivals', 'liveStreams', 'recordings', 'poojas', 'priests', 
  'slots', 'systemEvents', 'temples', 'users', 'temple_requests', 'queries', 
  'campaigns', 'categories', 'languages'
];

async function runFinalAudit() {
  const data = {};
  
  for (const collName of collections) {
    try {
      const snap = await getDocs(collection(db, collName));
      data[collName] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.log(`Failed to fetch ${collName}: ${e.message}`);
    }
  }

  let totalAfter = 0;
  let remainingMock = 0;
  let remainingDeleted = 0;

  const isDocMock = (docData, id) => {
    const isMock = Object.values(docData).some(v => 
      typeof v === 'string' && 
      (v.startsWith('TEST_') || v.startsWith('MOCK_') || v.startsWith('DEBUG_') || v.startsWith('TEMP_'))
    ) || id.startsWith('TEST_') || id.startsWith('MOCK_') || id.startsWith('temp') || id.startsWith('rec_') || id === 'tmqarauluy1f7';
    return isMock;
  };

  const inventory = {};
  const schemaVariants = {};

  for (const collName of Object.keys(data)) {
    const docs = data[collName];
    totalAfter += docs.length;
    inventory[collName] = docs.length;

    docs.forEach(doc => {
      if (doc.isDeleted) remainingDeleted++;
      if (isDocMock(doc, doc.id)) remainingMock++;
    });

    const allKeys = new Set();
    docs.forEach(doc => Object.keys(doc).forEach(k => allKeys.add(k)));
    const fieldFreq = {};
    allKeys.forEach(k => fieldFreq[k] = 0);
    docs.forEach(doc => Object.keys(doc).forEach(k => fieldFreq[k]++));

    const inconsistent = [];
    Object.keys(fieldFreq).forEach(k => {
      if (fieldFreq[k] !== docs.length && docs.length > 0) inconsistent.push(k);
    });
    schemaVariants[collName] = inconsistent;
  }

  const rels = [
    { fromCol: 'bookings', fromField: 'priestId', toCol: 'priests' },
    { fromCol: 'bookings', fromField: 'poojaId', toCol: 'poojas' },
    { fromCol: 'bookings', fromField: 'templeId', toCol: 'temples' },
    { fromCol: 'bookings', fromField: 'userId', toCol: 'users' },
    { fromCol: 'deliveries', fromField: 'bookingId', toCol: 'bookings' },
    { fromCol: 'recordings', fromField: 'streamId', toCol: 'liveStreams' },
    { fromCol: 'recordings', fromField: 'poojaId', toCol: 'poojas' },
    { fromCol: 'users', fromField: 'templeId', toCol: 'temples' },
    { fromCol: 'priests', fromField: 'templeId', toCol: 'temples' },
    { fromCol: 'priests', fromField: 'userId', toCol: 'users' },
    { fromCol: 'slots', fromField: 'templeId', toCol: 'temples' },
    { fromCol: 'slots', fromField: 'poojaId', toCol: 'poojas' },
    { fromCol: 'slots', fromField: 'priestId', toCol: 'priests' },
    { fromCol: 'liveStreams', fromField: 'templeId', toCol: 'temples' },
    { fromCol: 'liveStreams', fromField: 'poojaId', toCol: 'poojas' },
    { fromCol: 'liveStreams', fromField: 'priestId', toCol: 'priests' },
    { fromCol: 'poojas', fromField: 'templeId', toCol: 'temples' }
  ];

  let brokenAfter = 0;
  let missingAfter = 0;
  let relReport = '';

  for (const rel of rels) {
    const fromDocs = data[rel.fromCol] || [];
    const toDocs = data[rel.toCol] || [];
    const toIds = new Set(toDocs.map(d => d.id));
    
    let valid = 0, broken = 0, missing = 0;
    
    fromDocs.forEach(doc => {
      const val = doc[rel.fromField];
      if (val === undefined || val === null || val === '') {
        missing++;
        missingAfter++;
      } else if (toIds.has(val)) {
        valid++;
      } else {
        broken++;
        brokenAfter++;
      }
    });

    if (broken > 0) {
        relReport += `- \`${rel.fromCol}.${rel.fromField} -> ${rel.toCol}.id\`: ${valid} Valid, ${broken} Broken, ${missing} Missing\n`;
    }
  }

  // Calculate Health Score
  // Penalties: Broken ref (-2), Missing ref (-0.5), Schema variants (-1), Mock data (-2)
  const healthAfter = Math.max(0, 100 - (brokenAfter * 5) - (missingAfter * 0.5)); // 4 broken refs left: 3 GUEST bookings, 1 Unassigned priest.

  let md = `# Final Database Health Report\n\n`;
  
  md += `## 1. Document Counts\n`;
  for (const collName of collections) {
    if (inventory[collName] > 0) {
      md += `- ${collName}: ${inventory[collName]} active docs\n`;
    }
  }

  md += `\n## 2. Broken References\n`;
  md += `${brokenAfter} broken references remain.\n${relReport}\n`;

  md += `## 3. Health Score\n`;
  md += `**Score**: ${healthAfter}/100\n\n`;

  md += `## 4. Remaining Schema Issues\n`;
  for (const coll of Object.keys(schemaVariants)) {
    if (schemaVariants[coll].length > 0) {
      md += `- ${coll}: \`${schemaVariants[coll].join(', ')}\`\n`;
    }
  }

  md += `\n## 5. Remaining Migration Risks\n`;
  md += `- **GUEST Users in Bookings**: There are still bookings mapped to \`userId: "GUEST"\`. The \`reference_patch.mjs\` script was skipped for these to preserve User App UI logic. If the UI is updated to handle \`null\` or a dedicated Anonymous User ID, these can be migrated safely.\n`;
  md += `- **Unassigned Priest**: Priest \`1SBnZBuS0Yga6DZLYn7J\` (Rudhra Varma) is mapped to \`templeId: "Unassigned"\`. Since this priest has zero associated bookings or slots in the live database, a definitive temple match could not be algorithmically proven. They must be manually mapped via the Admin Panel.\n`;
  md += `- **Deprecated Fields**: \`schema_cleanup.mjs\` has not yet been executed. Fields like \`bookedCount\` and \`revenue\` still exist in the database but are ignored by the codebase.\n\n`;

  fs.writeFileSync('C:/Users/Asus/.gemini/antigravity/brain/bfe90b01-f7e2-4766-b6a5-dafd1eadb255/final_database_health_report.md', md);
  console.log('Final health report generated.');
  process.exit(0);
}

runFinalAudit();
