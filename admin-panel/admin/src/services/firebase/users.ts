import { collection, doc, setDoc, getDocs, query, where, updateDoc, onSnapshot } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { db, auth, secondaryAuth } from '../../lib/firebase';
import { AppUser } from '../../contexts/AuthContext';

export const FirebaseUsersService = {
  /**
   * Subscribe to all PRO users
   */
  subscribeToProUsers(callback: (users: AppUser[]) => void) {
    const q = query(collection(db, 'users'), where('role', '==', 'PRO'));
    return onSnapshot(q, (snapshot) => {
      const users: AppUser[] = [];
      snapshot.forEach(doc => {
        users.push(doc.data() as AppUser);
      });
      callback(users);
    });
  },

  /**
   * Get all active PRO users
   */
  async getPros() {
    const q = query(collection(db, 'users'), where('role', '==', 'PRO'), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AppUser);
  },

  /**
   * Create a new PRO user
   */
  async createProUser(data: { name: string; email: string; phone: string; templeId: string; password?: string }, adminUid: string) {
    if (!data.password) throw new Error("Password is required to create a PRO user.");
    
    let uid;
    try {
      // Create using secondary auth to avoid signing out the Admin
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
      uid = userCredential.user.uid;
      
      // Sign out of secondary auth immediately
      await signOut(secondaryAuth);
    } catch (e: any) {
      throw new Error("Auth user creation failed: " + e.message);
    }

    // Create Firestore document
    const userDoc: AppUser = {
      uid,
      name: data.name,
      email: data.email,
      role: 'PRO',
      templeId: data.templeId,
      isActive: true,
      // Storing phone for UI purposes
      ...({ phone: data.phone } as any)
    };

    const now = new Date().toISOString();

    try {
      await setDoc(doc(db, 'users', uid), {
        ...userDoc,
        createdAt: now,
        updatedAt: now,
        createdBy: adminUid,
        updatedBy: adminUid,
        isDeleted: false
      });
    } catch (e: any) {
      throw new Error("Firestore document creation failed: " + e.message);
    }

    return uid;
  },

  /**
   * Toggle active status
   */
  async toggleActiveStatus(uid: string, currentStatus: boolean) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isActive: !currentStatus
    });
  },

  /**
   * Reset Password Email
   */
  async triggerPasswordReset(email: string) {
    await sendPasswordResetEmail(auth, email);
  },
  
  /**
   * Update PRO User details
   */
  async updateProUser(uid: string, data: { name: string; phone: string; templeId: string }, adminUid: string) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      name: data.name,
      phone: data.phone,
      templeId: data.templeId,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUid
    });
  }
};
