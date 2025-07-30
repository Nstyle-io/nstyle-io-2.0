// Export all Firebase services
export { FirebaseAuthService } from './auth';
export { FirestoreService } from './firestore';
export { FirebaseStorageService } from './storage';
export { FirebaseAnalyticsService } from './analytics';

// Export Firebase instances
export { 
  firebaseAuth, 
  firestore, 
  firebaseStorage, 
  analytics 
} from './config';

// Export Firebase app
export { default as firebaseApp } from './config';