import { createServer } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function verifyApp(appName, rootPath) {
  console.log(`\n--- Verifying ${appName} Service Layer ---`);
  
  const vite = await createServer({
    root: rootPath,
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    // Dynamically load the service layers using Vite so import.meta.env is resolved
    const dbModule = await vite.ssrLoadModule('/src/services/firebase/db.ts');
    const authModule = await vite.ssrLoadModule('/src/services/firebase/auth.ts');
    
    // Check if API keys exist
    if (!vite.environments.ssr.config.env.VITE_FIREBASE_API_KEY) {
      console.log(`[${appName}] SKIPPED: VITE_FIREBASE_API_KEY is missing in .env. Please fill the .env file.`);
      return;
    }

    console.log(`[${appName}] Running Auth Verification...`);
    const authResult = await authModule.FirebaseAuthService.verifyConnection();
    console.log(`[${appName}] Auth Status:`, authResult.success ? 'Success' : 'Failed', '-', authResult.message);

    console.log(`[${appName}] Running Firestore Verification...`);
    const dbResult = await dbModule.FirebaseDBService.verifyConnection();
    console.log(`[${appName}] Firestore Status:`, dbResult ? 'Success (Write/Delete tested)' : 'Failed');
    
  } catch (error) {
    console.error(`[${appName}] Verification Error:`, error.message);
  } finally {
    await vite.close();
  }
}

async function run() {
  await verifyApp('Admin Panel', resolve(__dirname, 'admin-panel/admin'));
  await verifyApp('PRO Panel', resolve(__dirname, 'pro-panel'));
  process.exit(0);
}

run();
