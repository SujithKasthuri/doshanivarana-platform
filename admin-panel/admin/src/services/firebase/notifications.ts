import { collection, doc, onSnapshot, query, where, updateDoc, setDoc, getDoc, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { withAudit, softDelete } from './core';

const CAMPAIGNS_COLLECTION = 'notification_campaigns';
const NOTIFICATIONS_COLLECTION = 'notifications';

export type TargetAudience = "All Users" | "All PRO Managers" | "Temple Specific" | "Recent Devotees" | "Custom";
export type CampaignStatus = "Draft" | "Scheduled" | "Sent";

const VALID_AUDIENCES: TargetAudience[] = ["All Users", "All PRO Managers", "Temple Specific", "Recent Devotees", "Custom"];

export const NotificationsService = {
  subscribeToCampaigns(callback: (campaigns: any[]) => void) {
    const q = query(collection(db, CAMPAIGNS_COLLECTION), where('isDeleted', '==', false));
    return onSnapshot(q, (snapshot) => {
      const campaigns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(campaigns);
    });
  },

  async createCampaign(id: string, data: any, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');
    
    if (!VALID_AUDIENCES.includes(data.targetAudience)) {
      throw new Error("Invalid target audience.");
    }
    if (data.targetAudience === "Temple Specific" && !data.targetTempleId) {
      throw new Error("targetTempleId is required for Temple Specific campaigns.");
    }

    if (data.scheduledAt) {
      const scheduledTime = data.scheduledAt.toMillis ? data.scheduledAt.toMillis() : data.scheduledAt.getTime();
      if (scheduledTime <= Date.now()) {
        throw new Error("scheduledAt must be a future date.");
      }
    }

    const campaignData = withAudit({
      ...data,
      status: "Draft", // Always start as Draft
      deliveryCount: 0, // Service managed
      readCount: 0,
      unreadCount: 0,
    }, false);

    campaignData.createdBy = uid;
    campaignData.updatedBy = uid;

    await setDoc(doc(db, CAMPAIGNS_COLLECTION, id), campaignData);
  },

  async updateCampaign(id: string, data: any, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');
    
    await runTransaction(db, async (transaction) => {
      const docRef = doc(db, CAMPAIGNS_COLLECTION, id);
      const snap = await transaction.get(docRef);
      if (!snap.exists()) throw new Error("Campaign does not exist.");
      
      const currentData = snap.data();
      
      // Immutability Check
      if (currentData.status === "Sent") {
        if (data.title !== undefined || data.body !== undefined || data.targetAudience !== undefined || data.scheduledAt !== undefined) {
          throw new Error("Sent campaigns become immutable and cannot be modified.");
        }
      }

      if (data.targetAudience && !VALID_AUDIENCES.includes(data.targetAudience)) {
        throw new Error("Invalid target audience.");
      }
      
      const targetAudience = data.targetAudience || currentData.targetAudience;
      if (targetAudience === "Temple Specific") {
         const templeId = data.targetTempleId !== undefined ? data.targetTempleId : currentData.targetTempleId;
         if (!templeId) throw new Error("targetTempleId is required for Temple Specific campaigns.");
      }

      // Status Transition Check
      if (data.status && data.status !== currentData.status) {
        if (currentData.status === "Draft" && data.status !== "Scheduled") {
          throw new Error(`Invalid transition: ${currentData.status} -> ${data.status}`);
        }
        if (currentData.status === "Scheduled" && data.status !== "Sent") {
          throw new Error(`Invalid transition: ${currentData.status} -> ${data.status}`);
        }
        if (currentData.status === "Sent") {
          throw new Error(`Invalid transition: Cannot change status from Sent.`);
        }
      }

      // Scheduled At Validation
      const scheduledAtObj = data.scheduledAt || currentData.scheduledAt;
      if ((data.status === "Scheduled" || currentData.status === "Scheduled") && scheduledAtObj) {
        const scheduledTime = scheduledAtObj.toMillis ? scheduledAtObj.toMillis() : scheduledAtObj.getTime();
        // If updating scheduledAt or setting to Scheduled, ensure it's in future
        if (data.scheduledAt || (data.status === "Scheduled" && currentData.status !== "Scheduled")) {
          if (scheduledTime <= Date.now()) {
            throw new Error("scheduledAt must be a future date.");
          }
        }
      }

      // Prevent service-managed fields from being overwritten manually
      const safeData = { ...data };
      delete safeData.deliveryCount;
      delete safeData.readCount;
      delete safeData.unreadCount;

      if (data.status === "Sent" && currentData.status !== "Sent") {
        safeData.sentAt = serverTimestamp();
      }

      const audited = withAudit(safeData, true);
      audited.updatedBy = uid;
      
      transaction.update(docRef, audited);
    });
  },

  async softDeleteCampaign(id: string, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');
    const docRef = doc(db, CAMPAIGNS_COLLECTION, id);
    const deleteData = softDelete();
    deleteData.updatedBy = uid;
    // @ts-ignore
    deleteData.deletedBy = uid;
    await updateDoc(docRef, deleteData);
  },

  // --------------------------------------------------------------------------
  // Notifications
  // --------------------------------------------------------------------------

  subscribeToUserNotifications(userId: string, callback: (notifications: any[]) => void) {
    const q = query(collection(db, NOTIFICATIONS_COLLECTION), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(notifications);
    });
  },

  async createNotification(id: string, data: { campaignId: string, userId: string, title: string, body: string }, adminUid?: string) {
    const uid = adminUid ?? (auth.currentUser?.uid || 'system');

    await runTransaction(db, async (transaction) => {
      const campRef = doc(db, CAMPAIGNS_COLLECTION, data.campaignId);
      const campSnap = await transaction.get(campRef);
      if (!campSnap.exists()) throw new Error("Campaign does not exist.");

      const notifRef = doc(db, NOTIFICATIONS_COLLECTION, id);
      transaction.set(notifRef, {
        ...data,
        isRead: false,
        readAt: null,
        createdAt: serverTimestamp()
      });

      // Update metrics
      transaction.update(campRef, {
        deliveryCount: increment(1),
        unreadCount: increment(1)
      });
    });
  },

  async markAsRead(id: string) {
    await runTransaction(db, async (transaction) => {
      const notifRef = doc(db, NOTIFICATIONS_COLLECTION, id);
      const notifSnap = await transaction.get(notifRef);
      if (!notifSnap.exists()) throw new Error("Notification does not exist.");

      const notifData = notifSnap.data();
      if (notifData.isRead) return; // already read

      transaction.update(notifRef, {
        isRead: true,
        readAt: serverTimestamp()
      });

      if (notifData.campaignId) {
        const campRef = doc(db, CAMPAIGNS_COLLECTION, notifData.campaignId);
        transaction.update(campRef, {
          unreadCount: increment(-1),
          readCount: increment(1)
        });
      }
    });
  }
};
