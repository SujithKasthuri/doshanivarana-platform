// @ts-nocheck
import { firestoreProvider as firestore } from '../../lib/firebaseProvider';
import { Booking } from '@devaseva/core/src/types/booking.types';
import { BookingStatus, PaymentStatus, DeliveryStatus } from '@devaseva/core/src/enums/status.enums';

export const BookingsService = {
  async createBooking(userId: string, slotId: string, bookingData: Partial<Booking>) {
    return firestore().runTransaction(async (transaction) => {
      const slotRef = firestore().collection('slots').doc(slotId);
      const slotDoc = await transaction.get(slotRef);
      if (!slotDoc.exists) throw new Error("Slot not found");
      const slot = slotDoc.data();
      if (!slot) throw new Error("Slot data empty");

      const capacity = slot.capacity || 0;
      const bookedCount = slot.bookedCount || 0;
      const availableSeats = slot.availableSeats !== undefined ? slot.availableSeats : (capacity - bookedCount);
      if (availableSeats <= 0) throw new Error("Slot full");

      const updatePayload: any = {};
      if (slot.availableSeats !== undefined) {
        updatePayload.availableSeats = firestore.FieldValue.increment(-1);
      }
      if (slot.bookedCount !== undefined) {
        updatePayload.bookedCount = firestore.FieldValue.increment(1);
      }
      const isFull = availableSeats - 1 <= 0;
      updatePayload.status = isFull 
        ? (slot.status === 'Available' ? 'Full' : 'FULL') 
        : slot.status;

      transaction.update(slotRef, updatePayload);

      const bookingRef = firestore().collection('bookings').doc();
      const newBooking = {
        ...bookingData,
        id: bookingRef.id,
        userId,
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.SUCCESS,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      };
      transaction.set(bookingRef, newBooking);

      if (bookingData.hasPrasadDelivery) {
        const deliveryRef = firestore().collection('deliveries').doc();
        transaction.set(deliveryRef, {
          id: deliveryRef.id,
          bookingId: bookingRef.id,
          userId,
          status: DeliveryStatus.PACKED,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp()
        });
      }

      const eventRef = firestore().collection('systemEvents').doc();
      transaction.set(eventRef, {
        id: eventRef.id,
        eventType: 'booking.created',
        entityId: bookingRef.id,
        entityType: 'booking',
        payload: { bookingId: bookingRef.id, userId },
        status: 'PENDING',
        createdAt: firestore.FieldValue.serverTimestamp()
      });

      return bookingRef.id;
    });
  },

  async getUserBookings(userId: string) {
    const snapshot = await firestore().collection('bookings')
      .where('userId', '==', userId)
      .where('isDeleted', '==', false)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
  },

  subscribeToUserBookings(userId: string, callback: (bookings: Booking[]) => void) {
    return firestore().collection('bookings')
      .where('userId', '==', userId)
      .where('isDeleted', '==', false)
      .onSnapshot((snapshot: any) => {
        if (snapshot) {
          const list = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Booking));
          callback(list);
        }
      });
  },

  subscribeToBookingById(bookingId: string, callback: (booking: Booking | null) => void) {
    return firestore().collection('bookings').doc(bookingId)
      .onSnapshot((doc: any) => {
        if (doc && doc.exists) {
          callback({ id: doc.id, ...doc.data() } as Booking);
        } else {
          callback(null);
        }
      });
  },

  async getUpcomingBookings(userId: string) {
    const snapshot = await firestore().collection('bookings')
      .where('userId', '==', userId)
      .where('status', '==', BookingStatus.CONFIRMED)
      .where('isDeleted', '==', false)
      .get();
    // In production, we'd filter by scheduledDate >= today here
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
  },

  async getCompletedBookings(userId: string) {
    const snapshot = await firestore().collection('bookings')
      .where('userId', '==', userId)
      .where('status', '==', BookingStatus.COMPLETED)
      .where('isDeleted', '==', false)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
  },

  async cancelBooking(bookingId: string, userId: string, reason: string) {
    const bookingRef = firestore().collection('bookings').doc(bookingId);
    await bookingRef.update({
      status: BookingStatus.CANCELLED,
      cancellationReason: reason,
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
  }
};
