import { firestoreProvider as firestore } from '../../lib/firebaseProvider';

export const NotificationsService = {
  async getNotifications(userId: string) {
    const snapshot = await firestore().collection('notifications')
      .where('recipientId', '==', userId)
      .where('isDeleted', '==', false)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async markAsRead(notificationId: string) {
    await firestore().collection('notifications').doc(notificationId).update({
      isRead: true,
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
  },

  async markAllAsRead(userId: string) {
    const snapshot = await firestore().collection('notifications')
      .where('recipientId', '==', userId)
      .where('isRead', '==', false)
      .get();
      
    const batch = firestore().batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        isRead: true,
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();
  }
};
