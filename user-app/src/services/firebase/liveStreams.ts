import { firestoreProvider as firestore } from '../../lib/firebaseProvider';

export const LiveStreamsService = {
  async getUserLiveStreams(userId: string) {
    const bookingsSnap = await firestore().collection('bookings')
      .where('userId', '==', userId)
      .get();
    const bookingIds = bookingsSnap.docs.map(doc => doc.id);
    if (bookingIds.length === 0) return [];

    // Since we cannot easily do 'in' array > 10 items, just fetch all active streams and filter client side or do chunking
    const snapshot = await firestore().collection('liveStreams')
      .where('isDeleted', '==', false)
      .get();
      
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter((stream: any) => bookingIds.includes(stream.bookingId));
  },

  async getLiveStreamByBooking(bookingId: string) {
    const snapshot = await firestore().collection('liveStreams')
      .where('bookingId', '==', bookingId)
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      ...data,
      status: data.streamStatus || data.status // Adapter pattern applied
    };
  },

  async getActiveStreams() {
    // Adapter mapping 'LIVE' or streamStatus 'LIVE'
    const snapshot = await firestore().collection('liveStreams')
      .where('isDeleted', '==', false)
      .get();
      
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter((s: any) => s.status === 'LIVE' || s.streamStatus === 'LIVE');
  }
};
