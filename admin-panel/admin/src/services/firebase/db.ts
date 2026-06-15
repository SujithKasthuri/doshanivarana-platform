import { collection, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const FirebaseDBService = {
  /**
   * Verifies the connection to Firestore by writing and deleting a test document.
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const testCollection = collection(db, 'connection_tests');
      const docRef = await addDoc(testCollection, {
        timestamp: serverTimestamp(),
        source: 'admin-panel'
      });
      // Clean up the test document
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Firestore connection verification failed:', error);
      return false;
    }
  }
};
