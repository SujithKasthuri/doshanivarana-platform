import { collection, doc, onSnapshot, query, where, updateDoc, setDoc, getDocs, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { withAudit, softDelete } from './core';

const COLLECTION = 'deliveries';

export type DeliveryStatus = "Processing" | "Packed" | "Shipped" | "Out For Delivery" | "Delivered" | "Failed" | "Returned";

export const DeliveriesService = {
  subscribeToDeliveries(callback: (deliveries: any[]) => void) {
    const q = query(collection(db, COLLECTION), where('isDeleted', '==', false));
    return onSnapshot(q, (snapshot) => {
      const deliveries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(deliveries);
    });
  },

  async createDelivery(id: string, data: any, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');
    
    // 1. One Delivery Per Booking Guard
    const q = query(collection(db, COLLECTION), where('bookingId', '==', data.bookingId), where('isDeleted', '==', false));
    const existSnap = await getDocs(q);
    if (!existSnap.empty) {
      throw new Error("An active delivery already exists for this booking.");
    }

    await runTransaction(db, async (transaction) => {
      // 2. Fetch Booking
      const bookingRef = doc(db, 'bookings', data.bookingId);
      const bookingSnap = await transaction.get(bookingRef);
      
      if (!bookingSnap.exists()) {
        throw new Error("Booking does not exist.");
      }
      
      const bookingData = bookingSnap.data();
      
      // 3. Booking Status Validation
      if (!["Confirmed", "Completed"].includes(bookingData.bookingStatus)) {
        throw new Error(`Cannot create delivery for booking with status: ${bookingData.bookingStatus}`);
      }

      // 4. Create Delivery
      const deliveryRef = doc(db, COLLECTION, id);
      const deliveryData = withAudit({
        ...data,
        userId: bookingData.userId || 'GUEST',
        devoteeName: bookingData.devoteeName,
        bookingNumber: bookingData.bookingNumber,
        templeId: bookingData.templeId,
        templeName: bookingData.templeName,
        status: "Processing",
        deliveredAt: null,
      }, false);

      deliveryData.createdBy = uid;
      deliveryData.updatedBy = uid;

      transaction.set(deliveryRef, deliveryData);
    });
  },

  async updateDeliveryStatus(id: string, newStatus: DeliveryStatus, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');

    await runTransaction(db, async (transaction) => {
      const docRef = doc(db, COLLECTION, id);
      const snap = await transaction.get(docRef);
      if (!snap.exists()) throw new Error("Delivery does not exist.");
      
      const currentData = snap.data();
      const currentStatus = currentData.status;

      // Status Transition Guards
      if (currentStatus === "Failed") throw new Error("Cannot transition from Failed.");
      if (currentStatus === "Returned") throw new Error("Cannot transition from Returned.");
      
      if (newStatus === "Failed") {
        if (!["Processing", "Packed", "Shipped"].includes(currentStatus)) {
          throw new Error(`Invalid transition: ${currentStatus} -> Failed`);
        }
      } else if (newStatus === "Returned") {
        if (currentStatus !== "Delivered") {
          throw new Error(`Invalid transition: ${currentStatus} -> Returned`);
        }
      } else {
        const allowedTransitions: Record<string, string[]> = {
          "Processing": ["Packed"],
          "Packed": ["Shipped"],
          "Shipped": ["Out For Delivery"],
          "Out For Delivery": ["Delivered"]
        };
        
        const validNext = allowedTransitions[currentStatus] || [];
        if (!validNext.includes(newStatus)) {
          throw new Error(`Invalid transition: ${currentStatus} -> ${newStatus}`);
        }
      }

      // Tracking Number Validation
      if (["Shipped", "Out For Delivery", "Delivered"].includes(newStatus)) {
        if (!currentData.trackingNumber || currentData.trackingNumber.trim() === "") {
          throw new Error(`Tracking number is required for ${newStatus} status.`);
        }
      }

      // Automation
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: uid
      };

      if (newStatus === "Delivered") {
        updateData.deliveredAt = serverTimestamp();
      }

      transaction.update(docRef, updateData);
    });
  },

  async updateDelivery(id: string, data: any, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');
    const docRef = doc(db, COLLECTION, id);
    
    // Prevent overriding status via general update
    const safeData = { ...data };
    delete safeData.status;
    delete safeData.deliveredAt;

    const audited = withAudit(safeData, true);
    audited.updatedBy = uid;
    
    await updateDoc(docRef, audited);
  },

  async softDeleteDelivery(id: string, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');
    const docRef = doc(db, COLLECTION, id);
    const deleteData = softDelete();
    deleteData.updatedBy = uid;
    // @ts-ignore
    deleteData.deletedBy = uid;
    await updateDoc(docRef, deleteData);
  }
};
