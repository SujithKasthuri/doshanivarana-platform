import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// ─── Types ─────────────────────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'PRO';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  templeId?: string;
  isActive: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: AppUser | null;
  role: UserRole | null;
  templeId?: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserRole>;
  logout: () => Promise<void>;
}

// ─── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  currentUser: null,
  role: null,
  templeId: undefined,
  loading: true,
  login: async () => { throw new Error('AuthProvider not mounted'); },
  logout: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isDemoMode = import.meta.env.VITE_DEMO_AUTH_MODE === 'true';

  useEffect(() => {
    if (isDemoMode) {
      const demoUserStr = localStorage.getItem('demo_user');
      if (demoUserStr) {
        setCurrentUser(JSON.parse(demoUserStr));
        setLoading(false);
        return; // Only skip Firebase if a demo user is explicitly logged in
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as AppUser;
            setCurrentUser({ ...userData, uid: firebaseUser.uid });
          } else {
            console.error("User document not found in Firestore!");
            setCurrentUser(null);
            await signOut(auth);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoMode]);

  const login = useCallback(async (email: string, password: string): Promise<UserRole> => {
    // DEMO CHECK
    if (isDemoMode) {
      if (email === 'admin@doshanivarana.com' && password === 'Admin@123') {
        console.log("Demo Auth Path Triggered");
        const demoAdmin: AppUser = {
          uid: 'demo_admin_uid',
          name: 'Demo Admin',
          email: 'admin@doshanivarana.com',
          role: 'ADMIN',
          isActive: true
        };
        localStorage.setItem('demo_user', JSON.stringify(demoAdmin));
        setCurrentUser(demoAdmin);
        console.log("Dashboard Redirect Target: Admin Dashboard");
        return 'ADMIN';
      } else if (email === 'pro@doshanivarana.com' && password === 'Pro@123') {
        console.log("Demo Auth Path Triggered");
        const demoPro: AppUser = {
          uid: 'demo_pro_uid',
          name: 'Demo PRO',
          email: 'pro@doshanivarana.com',
          role: 'PRO',
          templeId: 'temple_001',
          isActive: true
        };
        localStorage.setItem('demo_user', JSON.stringify(demoPro));
        setCurrentUser(demoPro);
        console.log("Dashboard Redirect Target: PRO Dashboard");
        return 'PRO';
      }
    }

    // FIREBASE FALLBACK
    console.log("Firebase Auth Path Triggered");
    let uid;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      uid = userCredential.user.uid;
    } catch (e: any) {
      if (isDemoMode) {
         throw new Error("Invalid demo credentials."); // Fallback error message if BOTH failed and demo is enabled
      }
      throw e;
    }
    
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as AppUser;
      if (!userData.isActive) {
        await signOut(auth);
        throw new Error("Account is inactive. Please contact support.");
      }
      console.log("User Role Retrieved:", userData.role);
      console.log("Dashboard Redirect Target:", userData.role === 'ADMIN' ? 'Admin Dashboard' : 'PRO Dashboard');
      
      // PREVENT RACE CONDITION: Set current user synchronously before returning
      // so that immediate navigate('/') doesn't bounce back due to null user
      setCurrentUser({ ...userData, uid });
      
      return userData.role;
    } else {
      await signOut(auth);
      throw new Error("No user profile found.");
    }
  }, [isDemoMode]);

  const logout = useCallback(async () => {
    if (isDemoMode) {
      localStorage.removeItem('demo_user');
      setCurrentUser(null);
      return;
    }
    await signOut(auth);
  }, [isDemoMode]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!currentUser,
      currentUser,
      role: currentUser?.role ?? null,
      templeId: currentUser?.templeId,
      loading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
