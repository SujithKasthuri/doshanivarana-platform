import { collection, doc, setDoc, getDocs, query, where, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const FeedbackService = {
  subscribeToFeedback(callback: (feedback: any[]) => void) {
    const q = query(collection(db, 'feedback'), where('isDeleted', '==', false));
    return onSnapshot(q, (snapshot) => {
      const feedback: any[] = [];
      snapshot.forEach(doc => {
        feedback.push({ id: doc.id, ...doc.data() });
      });
      // Sort by createdAt descending
      feedback.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(feedback);
    });
  },

  async createFeedback(id: string, data: any, adminUid?: string) {
    const now = new Date().toISOString();
    const uid = adminUid ?? 'system';
    await setDoc(doc(db, 'feedback', id), {
      ...data,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
      createdBy: uid,
      updatedBy: uid,
      isDeleted: false
    });
  },

  async updateFeedbackStatus(id: string, status: string, adminUid: string) {
    const ref = doc(db, 'feedback', id);
    const now = new Date().toISOString();
    await updateDoc(ref, {
      status,
      moderatedBy: adminUid,
      moderatedAt: now,
      updatedAt: now,
      updatedBy: adminUid
    });
  },

  async deleteFeedback(id: string, adminUid: string) {
    const ref = doc(db, 'feedback', id);
    await updateDoc(ref, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      updatedBy: adminUid
    });
  }
};
