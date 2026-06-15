import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

// Initialize the Firebase Admin SDK with your downloaded service account key
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

async function setAdminClaim(email) {
  try {
    const user = await getAuth().getUserByEmail(email);
    
    // Set the custom claim
    await getAuth().setCustomUserClaims(user.uid, { role: 'ADMIN' });
    console.log(`✅ Success: Custom claim { role: 'ADMIN' } assigned to ${email}`);
    
    // Verify it was set
    const updatedUser = await getAuth().getUser(user.uid);
    console.log('Current claims:', updatedUser.customClaims);
    
  } catch (error) {
    console.error('❌ Error setting custom claims:', error);
  }
}

setAdminClaim('admin@doshanivarana.com');
