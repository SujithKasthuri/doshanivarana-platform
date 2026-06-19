const fs = require('fs');
const path = require('path');

// Mock AsyncStorage and React Native dependencies for Node testing environment
global.jest = { fn: () => {} };
global.AsyncStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {}
};

// Virtual mock for react-native-async-storage
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === '@react-native-async-storage/async-storage') {
    return global.AsyncStorage;
  }
  if (id === 'react-native') {
    return {
      Platform: { OS: 'web' }
    };
  }
  return originalRequire.apply(this, arguments);
};

// Register ts-node
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', esModuleInterop: true }
});

async function runTest() {
  console.log("Starting Firebase Provider Verification...");
  
  try {
    // Import authConfig to check mode
    const { AUTH_MODE } = require('../user-app/src/config/authConfig');
    console.log(`AUTH_MODE is set to: ${AUTH_MODE}`);
    if (AUTH_MODE !== 'DEMO') {
      throw new Error("AUTH_MODE must be 'DEMO' for this mock validation test");
    }

    // Import providers
    const { authProvider, firestoreProvider } = require('../user-app/src/lib/firebaseProvider');
    
    // 1. Verify getAuth / authProvider returns mock auth
    const auth = authProvider();
    console.log("authProvider() call successful.");
    if (!auth || typeof auth.signInWithEmailAndPassword !== 'function') {
      throw new Error("authProvider did not return a valid mock auth instance");
    }
    console.log("Verified: authProvider returns the mock Auth instance.");

    // 2. Verify getFirestore / firestoreProvider returns mock firestore
    const firestore = firestoreProvider();
    console.log("firestoreProvider() call successful.");
    if (!firestore || typeof firestore.collection !== 'function') {
      throw new Error("firestoreProvider did not return a valid mock firestore instance");
    }
    console.log("Verified: firestoreProvider returns the mock Firestore instance.");

    // 3. Verify static properties FieldValue and Timestamp are present on firestoreProvider
    if (!firestoreProvider.FieldValue || typeof firestoreProvider.FieldValue.serverTimestamp !== 'function') {
      throw new Error("firestoreProvider.FieldValue.serverTimestamp is not a function");
    }
    console.log("Verified: firestoreProvider.FieldValue.serverTimestamp is available.");

    if (!firestoreProvider.Timestamp || typeof firestoreProvider.Timestamp.now !== 'function') {
      throw new Error("firestoreProvider.Timestamp.now is not a function");
    }
    console.log("Verified: firestoreProvider.Timestamp.now is available.");

    // 4. Test user and session creation via AuthService using firestoreProvider
    const { AuthService } = require('../user-app/src/services/firebase/auth');
    const uid = 'demo_user_9876543210';
    const mobileNumber = '9876543210';

    console.log("Retrieving user profile (should be null initially)...");
    let profile = await AuthService.getUserProfile(uid);
    console.log(`Initial profile check: ${profile}`);

    console.log("Creating user profile document in mock firestore...");
    await firestore.collection('users').doc(uid).set({
      id: uid,
      phoneNumber: `+91${mobileNumber}`,
      phone: `+91 ${mobileNumber}`,
      profileName: 'Devotee',
      name: 'Devotee',
      role: 'USER',
      isDemoUser: true,
      createdAt: firestoreProvider.FieldValue.serverTimestamp(),
      updatedAt: firestoreProvider.FieldValue.serverTimestamp(),
      isDeleted: false
    });

    console.log("Verifying user profile document exists...");
    profile = await AuthService.getUserProfile(uid);
    if (!profile) {
      throw new Error("Failed to retrieve created user profile");
    }
    console.log("Retrieved profile data:", JSON.stringify(profile));

    console.log("Creating user session document...");
    await firestore.collection('userSessions').add({
      userId: uid,
      phoneNumber: `+91${mobileNumber}`,
      loginAt: firestoreProvider.FieldValue.serverTimestamp(),
      deviceInfo: `WEB Device`,
      isActive: true
    });

    console.log("Verifying session document exists...");
    const sessionsSnapshot = await firestore.collection('userSessions').where('userId', '==', uid).get();
    if (sessionsSnapshot.empty || sessionsSnapshot.docs.length === 0) {
      throw new Error("Failed to retrieve created session document");
    }
    console.log("Retrieved session data:", JSON.stringify(sessionsSnapshot.docs[0].data()));

    console.log("\n--- VERIFICATION RESULT ---");
    console.log("PASS");
    console.log("All requirements met: Firebase lazy-loading is functioning and mock auth/firestore operate correctly.");
  } catch (error) {
    console.error("\n--- VERIFICATION FAILED ---");
    console.error(error);
    process.exit(1);
  }
}

runTest();
