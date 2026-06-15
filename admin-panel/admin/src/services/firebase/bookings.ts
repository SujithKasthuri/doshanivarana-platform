import { collection, doc, onSnapshot, query, where, runTransaction, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { withAudit, softDelete } from './core';

const COLLECTION = 'bookings';

// Format: DN-YYYYMMDD-XXXX
function getSequenceString(count: number, dateStr: string) {
  const padded = count.toString().padStart(4, '0');
  return `DN-${dateStr}-${padded}`;
}

export const BookingsService = {
  subscribeToBookings(callback: (bookings: any[]) => void) {
    const q = query(collection(db, COLLECTION), where('isDeleted', '==', false));
    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(bookings);
    });
  },

  async createBooking(id: string, data: any, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');
    
    await runTransaction(db, async (transaction) => {
      // 1. Booking Sequence Counter
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      const counterRef = doc(db, 'counters', 'bookings');
      const counterSnap = await transaction.get(counterRef);
      
      let nextCount = 1;
      let counterData = { dateStr, count: 1 };
      
      if (counterSnap.exists()) {
        const currentData = counterSnap.data();
        if (currentData.dateStr === dateStr) {
          nextCount = currentData.count + 1;
          counterData.count = nextCount;
        }
      }
      
      const bookingNumber = getSequenceString(nextCount, dateStr);

      // 2. Validate Slot
      const slotRef = doc(db, 'slots', data.slotId);
      const slotSnap = await transaction.get(slotRef);
      
      if (!slotSnap.exists()) {
        throw new Error("Slot does not exist.");
      }
      
      const slotData = slotSnap.data();
      
      if (slotData.isDeleted) throw new Error("Slot is deleted.");
      if (slotData.status === "Cancelled") throw new Error("Slot is cancelled.");
      if (slotData.status === "Full") throw new Error("Slot is already full.");
      
      const currentBooked = slotData.bookedCount || 0;
      const capacity = slotData.capacity || 0;
      
      if (currentBooked >= capacity) {
        throw new Error("Slot capacity exceeded.");
      }

      // 3. Update Slot
      const newBookedCount = currentBooked + 1;
      const newSlotStatus = newBookedCount >= capacity ? "Full" : slotData.status;
      
      transaction.update(slotRef, {
        bookedCount: newBookedCount,
        status: newSlotStatus,
        updatedAt: now,
        updatedBy: uid
      });

      // 4. Update Counter
      transaction.set(counterRef, counterData, { merge: true });

      // 5. Create Booking
      const bookingRef = doc(db, COLLECTION, id);
      const bookingData = withAudit({
        ...data,
        bookingNumber,
        bookingStatus: data.bookingStatus || "Pending",
        paymentStatus: data.paymentStatus || "Pending"
      }, false);
      
      bookingData.createdBy = uid;
      bookingData.updatedBy = uid;

      transaction.set(bookingRef, bookingData);
    });
  },

  async updateBookingStatus(id: string, newStatus: string, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');

    await runTransaction(db, async (transaction) => {
      const bookingRef = doc(db, COLLECTION, id);
      const bookingSnap = await transaction.get(bookingRef);

      if (!bookingSnap.exists()) throw new Error("Booking does not exist.");
      
      const bookingData = bookingSnap.data();
      const currentStatus = bookingData.bookingStatus;

      // Validate transitions
      if (currentStatus === "Cancelled") throw new Error("Cannot transition from Cancelled status.");
      if (currentStatus === "Completed") throw new Error("Cannot transition from Completed status.");
      
      if (currentStatus === "Pending" && !["Confirmed", "Cancelled"].includes(newStatus)) {
        throw new Error(`Invalid transition: ${currentStatus} -> ${newStatus}`);
      }
      if (currentStatus === "Confirmed" && !["Completed", "Cancelled"].includes(newStatus)) {
        throw new Error(`Invalid transition: ${currentStatus} -> ${newStatus}`);
      }

      // If transitioning to Cancelled, release slot capacity
      if (newStatus === "Cancelled") {
        const slotRef = doc(db, 'slots', bookingData.slotId);
        const slotSnap = await transaction.get(slotRef);
        
        if (slotSnap.exists()) {
          const slotData = slotSnap.data();
          const currentBooked = slotData.bookedCount || 0;
          
          if (currentBooked > 0) {
            const newBookedCount = currentBooked - 1;
            const newSlotStatus = slotData.status === "Full" && newBookedCount < slotData.capacity 
              ? "Available" 
              : slotData.status;
            
            transaction.update(slotRef, {
              bookedCount: newBookedCount,
              status: newSlotStatus,
              updatedAt: new Date(),
              updatedBy: uid
            });
          }
        }
      }

      transaction.update(bookingRef, {
        bookingStatus: newStatus,
        updatedAt: new Date(),
        updatedBy: uid
      });
    });
  },

  async updateBooking(id: string, data: any, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');
    const docRef = doc(db, COLLECTION, id);
    
    // Prevent overriding bookingStatus via general update
    const safeData = { ...data };
    delete safeData.bookingStatus;

    const audited = withAudit(safeData, true);
    audited.updatedBy = uid;
    
    await updateDoc(docRef, audited);
  },

  async softDeleteBooking(id: string, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');
    const docRef = doc(db, COLLECTION, id);
    const deleteData = softDelete();
    deleteData.updatedBy = uid;
    // @ts-ignore
    deleteData.deletedBy = uid; 
    
    await updateDoc(docRef, deleteData);
  }
};
