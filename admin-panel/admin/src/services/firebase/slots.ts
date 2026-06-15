import { collection, doc, setDoc, updateDoc, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { withAudit, softDelete } from './core';

const COLLECTION = 'slots';

function validateSlotData(data: any, isUpdate = false) {
  if (!isUpdate || data.templeId !== undefined) {
    if (!data.templeId) throw new Error("templeId is required");
  }
  if (!isUpdate || data.poojaId !== undefined) {
    if (!data.poojaId) throw new Error("poojaId is required");
  }
  if (!isUpdate || data.priestId !== undefined) {
    if (!data.priestId) throw new Error("priestId is required");
  }

  if (data.capacity !== undefined && data.capacity <= 0) {
    throw new Error("capacity must be greater than zero");
  }

  const capacity = data.capacity;
  const bookedCount = data.bookedCount !== undefined ? data.bookedCount : 0;
  
  if (capacity !== undefined && bookedCount > capacity) {
    throw new Error("bookedCount cannot exceed capacity");
  }

  if (!isUpdate && data.startTime) {
    // For new slots, startTime cannot be in the past
    const now = Timestamp.now();
    if (data.startTime.toMillis() < now.toMillis()) {
      throw new Error("startTime cannot be in the past");
    }
  }

  if (data.startTime && data.endTime) {
    if (data.endTime.toMillis() <= data.startTime.toMillis()) {
      throw new Error("endTime must be greater than startTime");
    }
  }
}

function determineStatus(data: any, currentStatus?: string) {
  if (data.status === "Cancelled" || currentStatus === "Cancelled") {
    return "Cancelled"; // Allow manual cancellation to override automation unless explicitly changed back
  }
  
  const capacity = data.capacity || 0;
  const bookedCount = data.bookedCount || 0;

  if (capacity > 0 && bookedCount >= capacity) {
    return "Full";
  }
  return "Available";
}

export const SlotsService = {
  subscribeToSlots(callback: (slots: any[]) => void) {
    const q = query(collection(db, COLLECTION), where('isDeleted', '==', false));
    return onSnapshot(q, (snapshot) => {
      const slots = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(slots);
    });
  },

  async createSlot(id: string, data: any) {
    data.bookedCount = data.bookedCount || 0;
    
    validateSlotData(data, false);
    
    data.status = determineStatus(data);
    
    const docRef = doc(db, COLLECTION, id);
    await setDoc(docRef, withAudit(data, false));
  },

  async updateSlot(id: string, data: any, currentData?: any) {
    validateSlotData(data, true);

    const mergedData = { ...currentData, ...data };
    // Only automatically change status if it isn't being explicitly set to Cancelled
    if (data.status !== "Cancelled" && mergedData.status !== "Cancelled") {
        data.status = determineStatus(mergedData, currentData?.status);
    }
    
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, withAudit(data, true));
  },

  async softDeleteSlot(id: string) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, softDelete());
  }
};
