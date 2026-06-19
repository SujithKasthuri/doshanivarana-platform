import { firestoreProvider as firestore } from '../../lib/firebaseProvider';
import { UserProfile, UserRole } from '@devaseva/core';

export const AuthService = {
  async createUser(userId: string, data: Partial<UserProfile>) {
    await firestore().collection('users').doc(userId).set({
      ...data,
      role: UserRole.USER,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
  },

  async getUserProfile(userId: string) {
    const doc = await firestore().collection('users').doc(userId).get();
    return doc.exists ? doc.data() as UserProfile : null;
  },

  async updateUserProfile(userId: string, data: Partial<UserProfile>) {
    await firestore().collection('users').doc(userId).update({
      ...data,
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
  },

  async createSession(userId: string, deviceToken: string) {
    await firestore().collection('userSessions').add({
      userId,
      deviceToken,
      createdAt: firestore.FieldValue.serverTimestamp(),
      lastActiveAt: firestore.FieldValue.serverTimestamp()
    });
  }
};
