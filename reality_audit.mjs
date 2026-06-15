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

async function runRealityAudit() {
  const data = {};
  
  // 1. Fetch everything
  for (const collName of collections) {
    try {
      const snap = await getDocs(collection(db, collName));
      data[collName] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.log(`Failed to fetch ${collName}: ${e.message}`);
    }
  }

  // Generate Report
  let report = '# Firestore Reality Audit Report\n\n';
  report += '> [!NOTE]\n> This audit strictly inspects actual production/development data stored in Firestore. It ignores TypeScript assumptions and service logic.\n\n';

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
    { fromCol: 'feedback', fromField: 'bookingId', toCol: 'bookings' },
    { fromCol: 'liveStreams', fromField: 'templeId', toCol: 'temples' },
    { fromCol: 'liveStreams', fromField: 'poojaId', toCol: 'poojas' },
    { fromCol: 'liveStreams', fromField: 'priestId', toCol: 'priests' },
    { fromCol: 'poojas', fromField: 'templeId', toCol: 'temples' }
  ];

  const allKeys = (objs) => {
    const keys = new Set();
    objs.forEach(o => Object.keys(o).forEach(k => keys.add(k)));
    return Array.from(keys);
  };

  report += '## Collection Deep Dive\n\n';

  for (const collName of Object.keys(data)) {
    const docs = data[collName];
    if (docs.length === 0) continue;

    const keysSet = allKeys(docs);
    
    let isDeletedCount = 0;
    let unassignedTempleCount = 0;
    let mockTestCount = 0;
    let safeCleanupCandidates = [];

    const fieldFreq = {};
    keysSet.forEach(k => fieldFreq[k] = 0);

    docs.forEach(doc => {
      // isDeleted
      if (doc.isDeleted === true) isDeletedCount++;
      // templeId
      if (doc.templeId === 'Unassigned') unassignedTempleCount++;
      
      // Check prefix for mocks
      const isMock = Object.values(doc).some(v => 
        typeof v === 'string' && 
        (v.startsWith('TEST_') || v.startsWith('MOCK_') || v.startsWith('DEBUG_') || v.startsWith('TEMP_'))
      ) || doc.id.startsWith('TEST_') || doc.id.startsWith('MOCK_');
      
      if (isMock) {
        mockTestCount++;
        safeCleanupCandidates.push(doc.id);
      } else if (doc.isDeleted === true) {
        safeCleanupCandidates.push(doc.id);
      }

      // Fields
      Object.keys(doc).forEach(k => fieldFreq[k]++);
    });

    const consistentFields = [];
    const inconsistentFields = [];
    
    Object.keys(fieldFreq).forEach(k => {
      if (fieldFreq[k] === docs.length) consistentFields.push(k);
      else inconsistentFields.push(k);
    });

    report += `### Collection: ${collName}\n`;
    report += `- **Document Count**: ${docs.length}\n`;
    report += `- **Records with isDeleted=true**: ${isDeletedCount}\n`;
    if (keysSet.includes('templeId')) {
      report += `- **Records with templeId='Unassigned'**: ${unassignedTempleCount}\n`;
    }
    report += `- **TEST/MOCK/DEBUG Records**: ${mockTestCount}\n`;
    
    report += `\n**Actual Schema Observed (Fields present in all docs):**\n\`${consistentFields.join(', ')}\`\n`;
    report += `\n**Schema Variations (Missing or extra fields in some docs):**\n${inconsistentFields.length > 0 ? '\`' + inconsistentFields.join(', ') + '\`' : 'None'}\n`;
    
    report += `\n**Safe Cleanup Candidates (IDs of soft-deleted or mock data):**\n${safeCleanupCandidates.length > 0 ? safeCleanupCandidates.join(', ') : 'None'}\n\n`;
    report += `---\n\n`;
  }

  report += `## Relationship Integrity Report\n\n`;

  for (const rel of rels) {
    const fromDocs = data[rel.fromCol] || [];
    const toDocs = data[rel.toCol] || [];
    
    const toIds = new Set(toDocs.map(d => d.id));
    
    let valid = 0;
    let broken = 0;
    let missing = 0;
    let brokenDetails = [];
    
    fromDocs.forEach(doc => {
      const val = doc[rel.fromField];
      if (val === undefined || val === null || val === '') {
        missing++;
      } else if (toIds.has(val)) {
        valid++;
      } else {
        broken++;
        brokenDetails.push(`ID: ${doc.id} points to missing ${rel.toCol} -> ${val}`);
      }
    });

    report += `### \`${rel.fromCol}.${rel.fromField} -> ${rel.toCol}.id\`\n`;
    report += `- Valid References: ${valid}\n`;
    report += `- Broken References: ${broken}\n`;
    report += `- Missing References: ${missing}\n`;
    
    if (brokenDetails.length > 0) {
      report += `- **Broken Details**:\n  - \`${brokenDetails.join('\`\n  - \`')}\`\n`;
    }
    report += `\n`;
  }

  fs.writeFileSync('C:/Users/Asus/.gemini/antigravity/brain/bfe90b01-f7e2-4766-b6a5-dafd1eadb255/firestore_reality_audit.md', report);
  console.log('Reality Audit complete.');
  process.exit(0);
}

runRealityAudit();
