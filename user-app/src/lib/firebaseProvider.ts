import { Platform } from 'react-native';
import { AUTH_MODE } from '../config/authConfig';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Centralized Firebase provider helper for Auth and Firestore.
// authProvider → always DEMO (mock login, any 10-digit + 4-digit OTP)
// firestoreProvider → Real Firestore via compat Web SDK on Web, native SDK on Native

export const authProvider: () => FirebaseAuthTypes.Module = (() => {
  const fn = () => {
    // Keep Demo Login exactly as-is for all platforms
    return require('./firebase').auth();
  };
  return fn;
})();

export const firestoreProvider: any = (() => {
  const fn = () => {
    if (Platform.OS === 'web') {
      // Use Firebase compat layer - same .collection().get() API as native SDK
      const { webFirestore } = require('../config/firebaseWebConfig');
      return webFirestore();
    } else {
      return require('@react-native-firebase/firestore').default();
    }
  };

  Object.defineProperty(fn, 'FieldValue', {
    get() {
      if (Platform.OS === 'web') {
        const firebase = require('firebase/compat/app').default;
        return firebase.firestore.FieldValue;
      } else {
        return require('@react-native-firebase/firestore').default.FieldValue;
      }
    },
    configurable: true,
    enumerable: true,
  });

  Object.defineProperty(fn, 'Timestamp', {
    get() {
      if (Platform.OS === 'web') {
        const firebase = require('firebase/compat/app').default;
        return firebase.firestore.Timestamp;
      } else {
        return require('@react-native-firebase/firestore').default.Timestamp;
      }
    },
    configurable: true,
    enumerable: true,
  });

  return fn as any;
})();
