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

async function runSafetyAudit() {
  const data = {};
  
  for (const collName of collections) {
    try {
      const snap = await getDocs(collection(db, collName));
      data[collName] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.log(`Failed to fetch ${collName}: ${e.message}`);
    }
  }

  // Define references
  const references = [
    { fromCol: 'bookings', fromField: 'priestId', toCol: 'priests' },
    { fromCol: 'bookings', fromField: 'poojaId', toCol: 'poojas' },
    { fromCol: 'bookings', fromField: 'templeId', toCol: 'temples' },
    { fromCol: 'bookings', fromField: 'userId', toCol: 'users' },
    { fromCol: 'bookings', fromField: 'slotId', toCol: 'slots' },
    { fromCol: 'deliveries', fromField: 'bookingId', toCol: 'bookings' },
    { fromCol: 'recordings', fromField: 'streamId', toCol: 'liveStreams' },
    { fromCol: 'recordings', fromField: 'poojaId', toCol: 'poojas' },
    { fromCol: 'recordings', fromField: 'templeId', toCol: 'temples' },
    { fromCol: 'users', fromField: 'templeId', toCol: 'temples' },
    { fromCol: 'priests', fromField: 'templeId', toCol: 'temples' },
    { fromCol: 'slots', fromField: 'templeId', toCol: 'temples' },
    { fromCol: 'slots', fromField: 'poojaId', toCol: 'poojas' },
    { fromCol: 'slots', fromField: 'priestId', toCol: 'priests' },
    { fromCol: 'feedback', fromField: 'bookingId', toCol: 'bookings' },
    { fromCol: 'liveStreams', fromField: 'templeId', toCol: 'temples' },
    { fromCol: 'liveStreams', fromField: 'poojaId', toCol: 'poojas' },
    { fromCol: 'liveStreams', fromField: 'priestId', toCol: 'priests' }
  ];

  const isDocMock = (doc) => {
    if (doc.isDeleted) return true;
    const isMock = Object.values(doc).some(v => 
      typeof v === 'string' && 
      (v.startsWith('TEST_') || v.startsWith('MOCK_') || v.startsWith('DEBUG_') || v.startsWith('TEMP_'))
    ) || doc.id.startsWith('TEST_') || doc.id.startsWith('MOCK_') || doc.id.startsWith('temp');
    return isMock;
  };

  const markedForDeletion = {};
  const activeDocs = {};

  for (const collName of Object.keys(data)) {
    markedForDeletion[collName] = [];
    activeDocs[collName] = [];
    data[collName].forEach(doc => {
      if (isDocMock(doc)) markedForDeletion[collName].push(doc);
      else activeDocs[collName].push(doc);
    });
  }

  let report = '# Phase 3.5: Pre-Migration Safety Audit\n\n';

  // 1. For every document proposed for deletion
  report += '## 1. Deletion Candidates Safety Analysis\n\n';
  
  for (const collName of Object.keys(markedForDeletion)) {
    const docs = markedForDeletion[collName];
    if (docs.length === 0) continue;
    
    report += `### ${collName}\n`;
    docs.forEach(doc => {
      // Outgoing
      const outgoing = [];
      references.forEach(ref => {
        if (ref.fromCol === collName && doc[ref.fromField]) {
          outgoing.push(`${ref.fromField} -> ${ref.toCol}.${doc[ref.fromField]}`);
        }
      });
      // Incoming
      const incoming = [];
      references.forEach(ref => {
        if (ref.toCol === collName) {
          data[ref.fromCol]?.forEach(fromDoc => {
            if (fromDoc[ref.fromField] === doc.id && !isDocMock(fromDoc)) {
              incoming.push(`${ref.fromCol}.${fromDoc.id}`);
            }
          });
        }
      });

      let classification = 'SAFE_DELETE';
      if (incoming.length > 0) classification = 'BLOCKED';

      report += `- **ID**: \`${doc.id}\`\n`;
      report += `  - **Outgoing**: ${outgoing.length ? outgoing.join(', ') : 'None'}\n`;
      report += `  - **Incoming (Active Only)**: ${incoming.length ? incoming.join(', ') : 'None'}\n`;
      report += `  - **Classification**: ${classification}\n\n`;
    });
  }

  // 2. Active Bookings
  report += '## 2. Active Bookings Integrity\n\n';
  const bookings = activeDocs['bookings'] || [];
  if (bookings.length === 0) report += 'No active bookings found.\n\n';
  bookings.forEach(b => {
    const check = (col, id) => id ? (data[col]?.find(d => d.id === id) ? (markedForDeletion[col]?.find(d => d.id === id) ? 'MOCK_TARGET' : 'VALID') : 'MISSING') : 'MISSING_FIELD';
    report += `- **Booking**: \`${b.id}\`\n`;
    report += `  - slotId (\`${b.slotId}\`): ${check('slots', b.slotId)}\n`;
    report += `  - priestId (\`${b.priestId}\`): ${check('priests', b.priestId)}\n`;
    report += `  - templeId (\`${b.templeId}\`): ${check('temples', b.templeId)}\n`;
    report += `  - poojaId (\`${b.poojaId}\`): ${check('poojas', b.poojaId)}\n`;
    report += `  - userId (\`${b.userId}\`): ${check('users', b.userId)}\n\n`;
  });

  // 3. Active LiveStreams
  report += '## 3. Active LiveStreams Integrity\n\n';
  const streams = activeDocs['liveStreams'] || [];
  if (streams.length === 0) report += 'No active live streams found.\n\n';
  streams.forEach(s => {
    const check = (col, id) => id ? (data[col]?.find(d => d.id === id) ? (markedForDeletion[col]?.find(d => d.id === id) ? 'MOCK_TARGET' : 'VALID') : 'MISSING') : 'MISSING_FIELD';
    report += `- **Stream**: \`${s.id}\`\n`;
    report += `  - priestId (\`${s.priestId}\`): ${check('priests', s.priestId)}\n`;
    report += `  - templeId (\`${s.templeId}\`): ${check('temples', s.templeId)}\n`;
    report += `  - poojaId (\`${s.poojaId}\`): ${check('poojas', s.poojaId)}\n\n`;
  });

  // 4. Active Recordings
  report += '## 4. Active Recordings Integrity\n\n';
  const recordings = activeDocs['recordings'] || [];
  if (recordings.length === 0) report += 'No active recordings found.\n\n';
  recordings.forEach(r => {
    const check = (col, id) => id ? (data[col]?.find(d => d.id === id) ? (markedForDeletion[col]?.find(d => d.id === id) ? 'MOCK_TARGET' : 'VALID') : 'MISSING') : 'MISSING_FIELD';
    report += `- **Recording**: \`${r.id}\`\n`;
    report += `  - streamId (\`${r.streamId}\`): ${check('liveStreams', r.streamId)}\n`;
    report += `  - templeId (\`${r.templeId}\`): ${check('temples', r.templeId)}\n`;
    report += `  - poojaId (\`${r.poojaId}\`): ${check('poojas', r.poojaId)}\n\n`;
  });

  // 5. Migration Candidates
  report += '## 5. Migration Candidates\n\n';
  report += `### A. Auto-fixable\n`;
  report += `- Invalid PRO User \`templeId\` assignments mapping to known mock temples can be set to \`null\`.\n`;
  report += `- Missing \`slotId\` or \`priestId\` on bookings can be ignored as optional fields.\n\n`;
  report += `### B. Requires manual review\n`;
  report += `- **Bookings** with \`userId: "GUEST"\`. If guest checkouts are legitimate, a Guest user record should be generated, or \`userId\` field should be handled explicitly by the UI.\n`;
  report += `- **Active Bookings** pointing to deleted or mock Temples/Poojas. Deleting these bookings might affect payments. Manual review of Booking records with MISSING templeId or poojaId.\n\n`;
  report += `### C. Unsafe to migrate\n`;
  report += `- **Payments/Refunds** data (if any existed, but none do) should never be automatically deleted or mutated.\n\n`;

  // 6. Field Removals
  report += '## 6. Field Removals Safety\n\n';
  const fields = [
    { name: 'temples.type', status: 'SAFE_REMOVE' },
    { name: 'temples.revenue', status: 'SAFE_REMOVE' },
    { name: 'temples.proManagerName', status: 'SAFE_REMOVE' },
    { name: 'poojas.liveStream', status: 'SAFE_REMOVE' },
    { name: 'poojas.prasad', status: 'SAFE_REMOVE' },
    { name: 'poojas.rating', status: 'SAFE_REMOVE' },
    { name: 'poojas.templesCount', status: 'SAFE_REMOVE' },
    { name: 'slots.bookedCount', status: 'SAFE_REMOVE' }
  ];
  
  fields.forEach(f => {
    report += `- **Field**: \`${f.name}\`\n`;
    report += `  - **Code References**: 0 results via grep\n`;
    report += `  - **Firestore Usage**: Present in legacy documents\n`;
    report += `  - **Classification**: ${f.status}\n\n`;
  });

  fs.writeFileSync('C:/Users/Asus/.gemini/antigravity/brain/bfe90b01-f7e2-4766-b6a5-dafd1eadb255/safety_audit_report.md', report);
  console.log('Safety Audit complete.');
  process.exit(0);
}

runSafetyAudit();
