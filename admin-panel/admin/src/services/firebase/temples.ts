import { collection, doc, setDoc, updateDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { withAudit, softDelete } from './core';

const COLLECTION = 'temples';

export const TemplesService = {
  subscribeToTemples(callback: (temples: any[]) => void) {
    const q = query(collection(db, COLLECTION), where('isDeleted', '==', false));
    return onSnapshot(q, (snapshot) => {
      const temples = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(temples);
    });
  },

  async getTemples() {
    const q = query(collection(db, COLLECTION), where('isDeleted', '==', false));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async createTemple(id: string, data: any, adminUid: string = "system") {
    const now = new Date().toISOString();
    await setDoc(doc(db, 'temples', id), {
      ...data,
      createdAt: now,
      updatedAt: now,
      createdBy: adminUid,
      updatedBy: adminUid,
      isDeleted: false
    });
  },

  async updateTemple(id: string, data: any, adminUid: string = "system") {
    const ref = doc(db, 'temples', id);
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUid
    });
  },

  async deleteTemple(id: string) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, softDelete());
  }
};
