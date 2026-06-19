import { firestoreProvider as firestore } from '../../lib/firebaseProvider';

export const RecordingsService = {
  async getUserRecordings(userId: string) {
    const bookingsSnap = await firestore().collection('bookings')
      .where('userId', '==', userId)
      .get();
    const bookingIds = bookingsSnap.docs.map(doc => doc.id);
    if (bookingIds.length === 0) return [];

    const snapshot = await firestore().collection('recordings')
      .where('isDeleted', '==', false)
      .get();
      
    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          actualEndTime: data.actualEndTime || data.endedAt // Adapter
        } as any;
      })
      .filter((r: any) => bookingIds.includes(r.bookingId));
  },

  async getRecordingById(id: string) {
    const doc = await firestore().collection('recordings').doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data() as any;
    return {
      id: doc.id,
      ...data,
      actualEndTime: data.actualEndTime || data.endedAt
    };
  }
};
