import { auth } from '../../lib/firebase';

export const FirebaseAuthService = {
  /**
   * Verifies the connection to Firebase Auth by checking if the SDK initialized correctly.
   */
  async verifyConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (auth) {
         return { success: true, message: 'Auth SDK initialized successfully.' };
      }
      return { success: false, message: 'Auth object is null.' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Unknown error' };
    }
  }
};
