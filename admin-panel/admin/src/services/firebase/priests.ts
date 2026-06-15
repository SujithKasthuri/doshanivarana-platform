import { collection, doc, setDoc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { withAudit, softDelete } from './core';

const COLLECTION = 'priests';

export const PriestsService = {
  subscribeToPriests(callback: (priests: any[]) => void) {
    const q = query(collection(db, COLLECTION), where('isDeleted', '==', false));
    return onSnapshot(q, (snapshot) => {
      const priests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(priests);
    });
  },

  async createPriest(id: string, data: any) {
    const docRef = doc(db, COLLECTION, id);
    await setDoc(docRef, withAudit(data, false));
  },

  async updatePriest(id: string, data: any) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, withAudit(data, true));
  },

  async deletePriest(id: string) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, softDelete());
  }
};
