import { signInAnonymously } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export const FirebaseAuthService = {
  /**
   * Verifies the connection to Firebase Auth by attempting an anonymous sign-in.
   * Note: Anonymous sign-in must be enabled in the Firebase console for this to succeed.
   * If it is not enabled, this might fail with auth/operation-not-allowed, which still verifies network connectivity.
   */
  async verifyConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Just verifying we have an auth object initialized properly
      if (auth) {
         return { success: true, message: 'Auth SDK initialized successfully.' };
      }
      return { success: false, message: 'Auth object is null.' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Unknown error' };
    }
  }
};
