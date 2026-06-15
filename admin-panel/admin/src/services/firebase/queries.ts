import { collection, doc, setDoc, getDocs, query, where, updateDoc, onSnapshot, getDoc, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const QueriesService = {
  subscribeToQueries(callback: (queries: any[]) => void) {
    const q = query(collection(db, 'queries'), where('isDeleted', '==', false));
    return onSnapshot(q, (snapshot) => {
      const queries: any[] = [];
      snapshot.forEach(doc => {
        queries.push({ id: doc.id, ...doc.data() });
      });
      // Sort locally by updatedAt descending
      queries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      callback(queries);
    });
  },

  subscribeToMessages(queryId: string, callback: (messages: any[]) => void) {
    const q = query(collection(db, `queries/${queryId}/messages`), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(messages);
    });
  },

  async createQuery(id: string, data: any, adminUid?: string) {
    const now = new Date().toISOString();
    const uid = adminUid ?? 'system';
    await setDoc(doc(db, 'queries', id), {
      ...data,
      status: "Open",
      unreadCount: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: uid,
      updatedBy: uid,
      isDeleted: false
    });
  },

  async updateQueryStatus(id: string, status: string, adminUid: string) {
    const ref = doc(db, 'queries', id);
    await updateDoc(ref, {
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUid
    });
  },

  async addMessageToQuery(queryId: string, messageText: string, adminUid?: string) {
    const now = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const uid = adminUid ?? 'system';
    
    // Prevent orphan messages
    const queryRef = doc(db, 'queries', queryId);
    const snap = await getDoc(queryRef);
    if (!snap.exists()) {
      throw new Error(`Parent query ${queryId} does not exist. Cannot add message.`);
    }

    // Add message
    await addDoc(collection(db, `queries/${queryId}/messages`), {
      text: messageText,
      from: "Super Admin", // Assuming admin is replying
      time: timeStr,
      isAdmin: true,
      createdAt: now,
      createdBy: uid
    });

    const data = snap.data();
    const currentStatus = data.status;
    const newStatus = currentStatus === "Open" ? "In Progress" : currentStatus;
    await updateDoc(queryRef, {
      updatedAt: now,
      updatedBy: uid,
      status: newStatus,
    });
  },

  async deleteQuery(id: string, adminUid: string) {
    const ref = doc(db, 'queries', id);
    await updateDoc(ref, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      updatedBy: adminUid
    });
  }
};
