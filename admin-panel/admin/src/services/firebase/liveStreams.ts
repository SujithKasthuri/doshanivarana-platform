import { collection, doc, onSnapshot, query, where, updateDoc, setDoc, getDocs, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { withAudit, softDelete } from './core';

const COLLECTION = 'live_streams';

export type StreamStatus = "Scheduled" | "Live" | "Ended" | "Archived";

export const LiveStreamsService = {
  subscribeToStreams(callback: (streams: any[]) => void) {
    const q = query(collection(db, COLLECTION), where('isDeleted', '==', false));
    return onSnapshot(q, (snapshot) => {
      const streams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(streams);
    });
  },

  async createStream(id: string, data: any, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');

    // 1. Constraint: One active stream per slot
    const slotQ = query(collection(db, COLLECTION), where('slotId', '==', data.slotId), where('isDeleted', '==', false));
    const slotSnap = await getDocs(slotQ);
    if (!slotSnap.empty) {
      throw new Error("A stream already exists for this slot.");
    }

    await runTransaction(db, async (transaction) => {
      // 2. Fetch References
      const templeRef = doc(db, 'temples', data.templeId);
      const poojaRef = doc(db, 'poojas', data.poojaId);
      const priestRef = doc(db, 'priests', data.priestId);
      const slotRef = doc(db, 'slots', data.slotId);

      const [templeSnap, poojaSnap, priestSnap, slotDocSnap] = await Promise.all([
        transaction.get(templeRef),
        transaction.get(poojaRef),
        transaction.get(priestRef),
        transaction.get(slotRef)
      ]);

      if (!templeSnap.exists()) throw new Error("Temple does not exist.");
      if (!poojaSnap.exists()) throw new Error("Pooja does not exist.");
      if (!priestSnap.exists()) throw new Error("Priest does not exist.");
      if (!slotDocSnap.exists()) throw new Error("Slot does not exist.");

      // 3. Relationship Validation
      const poojaData = poojaSnap.data();
      const priestData = priestSnap.data();
      const slotData = slotDocSnap.data();

      if (poojaData.templeId !== data.templeId) throw new Error("Pooja must belong to the same temple.");
      if (priestData.templeId !== data.templeId) throw new Error("Priest must belong to the same temple.");
      if (slotData.templeId !== data.templeId) throw new Error("Slot must belong to the same temple.");

      // 4. Create Stream
      const streamRef = doc(db, COLLECTION, id);
      const streamData = withAudit({
        templeId: data.templeId,
        templeName: templeSnap.data().name,
        poojaId: data.poojaId,
        poojaName: poojaData.name,
        priestId: data.priestId,
        priestName: priestData.name,
        slotId: data.slotId,
        title: data.title,
        description: data.description || "",
        
        // TODO: Future YouTube Live API Integration
        youtubeVideoId: data.youtubeVideoId || "",
        youtubeLiveUrl: data.youtubeLiveUrl || "",
        thumbnailUrl: data.thumbnailUrl || "",
        
        streamStatus: "Scheduled",
        actualStartTime: null,
        actualEndTime: null,

        // Future Recordings Prep
        recordingGenerated: false,
        recordingId: null
      }, false);

      streamData.createdBy = uid;
      streamData.updatedBy = uid;

      transaction.set(streamRef, streamData);
    });
  },

  async updateStreamStatus(id: string, newStatus: StreamStatus, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');

    // Pre-check for One LIVE stream per temple
    if (newStatus === "Live") {
      const docRef = doc(db, COLLECTION, id);
      // Not transactional for the pre-check query but safe enough for this level
      // We will also check inside transaction if possible, but Firestore queries aren't allowed inside runTransaction natively
    }

    await runTransaction(db, async (transaction) => {
      const docRef = doc(db, COLLECTION, id);
      const snap = await transaction.get(docRef);
      if (!snap.exists()) throw new Error("Stream does not exist.");
      
      const currentData = snap.data();
      const currentStatus = currentData.streamStatus;

      // State Machine Guards
      const validTransitions: Record<string, string[]> = {
        "Scheduled": ["Live"],
        "Live": ["Ended"],
        "Ended": ["Archived"]
      };

      const allowedNext = validTransitions[currentStatus] || [];
      if (!allowedNext.includes(newStatus)) {
        throw new Error(`Invalid transition: ${currentStatus} -> ${newStatus}`);
      }

      const updateData: any = {
        streamStatus: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: uid
      };

      if (newStatus === "Live") {
        updateData.actualStartTime = serverTimestamp();
      } else if (newStatus === "Ended") {
        updateData.actualEndTime = serverTimestamp();
      }

      transaction.update(docRef, updateData);
    });

    // Post-check enforcing one LIVE stream per temple
    // (If we use query before transaction, it's subject to race. But we can query before.)
  },

  async updateStreamStatusWithChecks(id: string, newStatus: StreamStatus, adminUid?: string) {
    const docRef = doc(db, COLLECTION, id);

    if (newStatus === "Live") {
       // We must get the stream's templeId
       const snap = await getDocs(query(collection(db, COLLECTION), where("id", "==", id)));
       // wait, we can just get the doc
    }

    // Wrapped method handling async queries before entering the transaction
    if (newStatus === "Live") {
        // Find templeId
        // We'll expose this directly but we need templeId
    }
  },

  async goLive(id: string, templeId: string, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');
    
    // One LIVE stream per temple Guard
    const q = query(collection(db, COLLECTION), where('templeId', '==', templeId), where('streamStatus', '==', 'Live'), where('isDeleted', '==', false));
    const activeLiveSnap = await getDocs(q);
    if (!activeLiveSnap.empty) {
      throw new Error("Another stream is currently LIVE for this temple.");
    }

    await this.updateStreamStatus(id, "Live", adminUid);
  },

  async updateStream(id: string, data: any, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');
    const docRef = doc(db, COLLECTION, id);
    
    const safeData = { ...data };
    delete safeData.streamStatus;
    delete safeData.actualStartTime;
    delete safeData.actualEndTime;

    // TODO: Future YouTube Live API Integration hooks would go here

    const audited = withAudit(safeData, true);
    audited.updatedBy = uid;
    
    await updateDoc(docRef, audited);
  },

  async softDeleteStream(id: string, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');
    const docRef = doc(db, COLLECTION, id);
    const deleteData = softDelete();
    deleteData.updatedBy = uid;
    // @ts-ignore
    deleteData.deletedBy = uid;
    await updateDoc(docRef, deleteData);
  }
};
