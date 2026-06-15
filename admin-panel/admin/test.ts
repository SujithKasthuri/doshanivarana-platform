import { FirebaseDBService } from './src/services/firebase/db';

async function run() {
  const connected = await FirebaseDBService.verifyConnection();
  console.log("Connected:", connected);
  process.exit(0);
}
run();
