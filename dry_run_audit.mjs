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

async function runDryRun() {
  const data = {};
  for (const collName of collections) {
    try {
      const snap = await getDocs(collection(db, collName));
      data[collName] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {}
  }

  const isDocMock = (doc) => {
    if (doc.isDeleted) return true;
    const isMock = Object.values(doc).some(v => 
      typeof v === 'string' && 
      (v.startsWith('TEST_') || v.startsWith('MOCK_') || v.startsWith('DEBUG_') || v.startsWith('TEMP_'))
    ) || doc.id.startsWith('TEST_') || doc.id.startsWith('MOCK_') || doc.id.startsWith('temp') || doc.id.startsWith('rec_') || doc.id === 'tmqarauluy1f7';
    return isMock;
  };

  const report = {};

  // Script A: cleanup_test_data.mjs
  report.A = { scriptName: 'cleanup_test_data.mjs', affectedCollections: new Set(), beforeCount: 0, afterCount: 0, affectedDocs: [] };
  for (const collName of Object.keys(data)) {
    let collBefore = data[collName].length;
    report.A.beforeCount += collBefore;
    data[collName].forEach(doc => {
      if (isDocMock(doc)) {
        report.A.affectedCollections.add(collName);
        report.A.affectedDocs.push(`${collName}/${doc.id}`);
      } else {
        report.A.afterCount++;
      }
    });
  }

  // Script B: reference_patch.mjs
  report.B = { scriptName: 'reference_patch.mjs', affectedCollections: new Set(['users', 'priests']), beforeCount: 0, afterCount: 0, affectedDocs: [] };
  const users = data['users'] || [];
  const priests = data['priests'] || [];
  report.B.beforeCount = users.length + priests.length;
  report.B.afterCount = report.B.beforeCount; // Deleting no docs, just patching
  
  users.forEach(u => {
    if (u.templeId && !data['temples']?.find(t => t.id === u.templeId)) {
      report.B.affectedDocs.push(`users/${u.id}`);
    }
  });
  priests.forEach(p => {
    if (p.templeId && !data['temples']?.find(t => t.id === p.templeId)) {
      report.B.affectedDocs.push(`priests/${p.id}`);
    }
  });

  // Script C: schema_cleanup.mjs
  report.C = { scriptName: 'schema_cleanup.mjs', affectedCollections: new Set(['temples', 'poojas', 'slots']), beforeCount: 0, afterCount: 0, affectedDocs: [] };
  const temples = data['temples'] || [];
  const poojas = data['poojas'] || [];
  const slots = data['slots'] || [];
  report.C.beforeCount = temples.length + poojas.length + slots.length;
  report.C.afterCount = report.C.beforeCount; // No docs deleted

  temples.forEach(t => {
    if (t.type !== undefined || t.revenue !== undefined || t.proManagerName !== undefined) {
      report.C.affectedDocs.push(`temples/${t.id}`);
    }
  });
  poojas.forEach(p => {
    if (p.liveStream !== undefined || p.prasad !== undefined || p.rating !== undefined || p.templesCount !== undefined) {
      report.C.affectedDocs.push(`poojas/${p.id}`);
    }
  });
  slots.forEach(s => {
    if (s.bookedCount !== undefined) {
      report.C.affectedDocs.push(`slots/${s.id}`);
    }
  });

  // Convert Sets to Arrays
  report.A.affectedCollections = Array.from(report.A.affectedCollections);
  report.B.affectedCollections = Array.from(report.B.affectedCollections);
  report.C.affectedCollections = Array.from(report.C.affectedCollections);

  fs.writeFileSync('dry_run_report.json', JSON.stringify(report, null, 2));
  console.log('Dry run complete. Report saved to dry_run_report.json');
  process.exit(0);
}

runDryRun();
