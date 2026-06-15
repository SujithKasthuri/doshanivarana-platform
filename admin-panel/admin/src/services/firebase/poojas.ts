import { collection, doc, setDoc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { withAudit, softDelete } from './core';

const COLLECTION = 'poojas';

export const PoojasService = {
  subscribeToPoojas(callback: (poojas: any[]) => void) {
    const q = query(collection(db, COLLECTION), where('isDeleted', '==', false));
    return onSnapshot(q, (snapshot) => {
      const poojas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(poojas);
    });
  },

  async createPooja(id: string, data: any) {
    const docRef = doc(db, COLLECTION, id);
    await setDoc(docRef, withAudit(data, false));
  },

  async updatePooja(id: string, data: any) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, withAudit(data, true));
  },

  async deletePooja(id: string) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, softDelete());
  }
};
