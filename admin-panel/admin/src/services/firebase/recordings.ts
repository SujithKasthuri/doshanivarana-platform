import { collection, doc, onSnapshot, query, where, updateDoc, setDoc, getDocs, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { withAudit, softDelete } from './core';

const COLLECTION = 'recordings';

export type RecordingStatus = "Draft" | "Published" | "Archived";

export const RecordingsService = {
  subscribeToRecordings(callback: (recordings: any[]) => void) {
    const q = query(collection(db, COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const recordings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter((r: any) => r.isDeleted !== true);
      callback(recordings);
    });
  },

  async createRecording(id: string, streamId: string, data: any, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');

    await runTransaction(db, async (transaction) => {
      const streamRef = doc(db, 'liveStreams', streamId);
      const streamSnap = await transaction.get(streamRef);

      if (!streamSnap.exists()) {
        throw new Error("Stream does not exist.");
      }

      const streamData = streamSnap.data();

      // 1. Soft Delete check
      if (streamData.isDeleted) {
        throw new Error("Cannot generate recording from a deleted stream.");
      }

      // 2. Status Validation
      if (!["Ended", "Archived"].includes(streamData.streamStatus)) {
        throw new Error("Stream must be Ended or Archived to generate a recording.");
      }

      // 3. actualEndTime validation
      if (!streamData.actualEndTime) {
        throw new Error("Stream must have an actualEndTime.");
      }

      // 4. One-to-One constraint
      if (streamData.recordingGenerated) {
        throw new Error("A recording already exists for this stream.");
      }

      // Create Recording Doc
      const recordingRef = doc(db, COLLECTION, id);
      const recordingData = withAudit({
        streamId: streamId,
        streamTitle: streamData.title || "",
        templeId: streamData.templeId,
        templeName: streamData.templeName,
        poojaId: streamData.poojaId,
        poojaName: streamData.poojaName,
        priestId: streamData.priestId,
        priestName: streamData.priestName,
        
        recordingTitle: data.recordingTitle || streamData.title || "",
        recordingDescription: data.recordingDescription || streamData.description || "",
        recordingUrl: data.recordingUrl || "",
        thumbnailUrl: data.thumbnailUrl || streamData.thumbnailUrl || "",
        durationSeconds: data.durationSeconds || 0,
        
        recordingStatus: "Draft",
        publishedAt: null
      }, false);

      recordingData.createdBy = uid;
      recordingData.updatedBy = uid;

      transaction.set(recordingRef, recordingData);

      // 5. Stream Sync
      transaction.update(streamRef, {
        recordingGenerated: true,
        recordingId: id,
        updatedAt: serverTimestamp(),
        updatedBy: uid
      });
    });
  },

  async updateRecordingStatus(id: string, newStatus: RecordingStatus, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');

    await runTransaction(db, async (transaction) => {
      const docRef = doc(db, COLLECTION, id);
      const snap = await transaction.get(docRef);
      if (!snap.exists()) throw new Error("Recording does not exist.");
      
      const currentData = snap.data();
      const currentStatus = currentData.recordingStatus;

      // State Machine Guards
      const validTransitions: Record<string, string[]> = {
        "Draft": ["Published"],
        "Published": ["Archived"],
      };

      const allowedNext = validTransitions[currentStatus] || [];
      if (!allowedNext.includes(newStatus)) {
        throw new Error(`Invalid transition: ${currentStatus} -> ${newStatus}`);
      }

      const updateData: any = {
        recordingStatus: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: uid
      };

      if (newStatus === "Published") {
        updateData.publishedAt = serverTimestamp();
      }

      transaction.update(docRef, updateData);
    });
  },

  async updateRecording(id: string, data: any, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');
    const docRef = doc(db, COLLECTION, id);

    // Prevent modifying relationship fields
    const immutableFields = ["streamId", "templeId", "templeName", "poojaId", "poojaName", "priestId", "priestName"];
    for (const field of immutableFields) {
      if (field in data) {
        throw new Error(`Cannot modify immutable field: ${field}`);
      }
    }
    
    // Only allow specific updates
    const safeData: any = {};
    if (data.recordingTitle !== undefined) safeData.recordingTitle = data.recordingTitle;
    if (data.recordingDescription !== undefined) safeData.recordingDescription = data.recordingDescription;
    if (data.recordingUrl !== undefined) safeData.recordingUrl = data.recordingUrl;
    if (data.thumbnailUrl !== undefined) safeData.thumbnailUrl = data.thumbnailUrl;
    if (data.durationSeconds !== undefined) safeData.durationSeconds = data.durationSeconds;

    const audited = withAudit(safeData, true);
    audited.updatedBy = uid;
    
    await updateDoc(docRef, audited);
  },

  async softDeleteRecording(id: string, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');
    
    await runTransaction(db, async (transaction) => {
      const recordingRef = doc(db, COLLECTION, id);
      const recSnap = await transaction.get(recordingRef);
      
      if (!recSnap.exists()) throw new Error("Recording does not exist.");
      
      const recData = recSnap.data();
      const streamId = recData.streamId;

      // Update Stream Sync Reversal
      if (streamId) {
        const streamRef = doc(db, 'liveStreams', streamId);
        const streamSnap = await transaction.get(streamRef);
        if (streamSnap.exists()) {
           const streamData = streamSnap.data();
           if (streamData.recordingId === id) {
             transaction.update(streamRef, {
               recordingGenerated: false,
               recordingId: null,
               updatedAt: serverTimestamp(),
               updatedBy: uid
             });
           }
        }
      }

      // Soft delete recording
      const deleteData = softDelete();
      deleteData.updatedBy = uid;
      // @ts-ignore
      deleteData.deletedBy = uid;
      
      transaction.update(recordingRef, deleteData);
    });
  }
};
