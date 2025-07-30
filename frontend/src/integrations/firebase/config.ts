import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};

// Initialize Firebase only when needed to avoid conflicts
let app: any = null;

const initializeFirebase = () => {
  if (!app) {
    // Check if Firebase config is properly set
    if (firebaseConfig.apiKey === "your-api-key") {
      console.warn("Firebase not configured - using placeholder config");
      return null;
    }
    app = initializeApp(firebaseConfig);
  }
  return app;
};

// Lazy initialization of Firebase services
export const getFirebaseAuth = () => {
  const firebaseApp = initializeFirebase();
  return firebaseApp ? getAuth(firebaseApp) : null;
};

export const getFirebaseFirestore = () => {
  const firebaseApp = initializeFirebase();
  return firebaseApp ? getFirestore(firebaseApp) : null;
};

export const getFirebaseStorage = () => {
  const firebaseApp = initializeFirebase();
  return firebaseApp ? getStorage(firebaseApp) : null;
};

export const getFirebaseAnalytics = () => {
  const firebaseApp = initializeFirebase();
  return firebaseApp && typeof window !== 'undefined' ? getAnalytics(firebaseApp) : null;
};

// Legacy exports for backwards compatibility
export const firebaseAuth = getFirebaseAuth();
export const firestore = getFirebaseFirestore();
export const firebaseStorage = getFirebaseStorage();
export const analytics = getFirebaseAnalytics();

export default app;