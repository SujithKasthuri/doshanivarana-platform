import { collection, doc, setDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { withAudit, softDelete } from './core';

const COLLECTION = 'festivals';

export const FestivalsService = {
  async getFestivals() {
    const q = query(collection(db, COLLECTION), where('isDeleted', '==', false));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async createFestival(id: string, data: any) {
    const docRef = doc(db, COLLECTION, id);
    await setDoc(docRef, withAudit(data, false));
  },

  async updateFestival(id: string, data: any) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, withAudit(data, true));
  },

  async deleteFestival(id: string) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, softDelete());
  }
};
