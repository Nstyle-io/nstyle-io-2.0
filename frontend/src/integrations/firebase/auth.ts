import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { getFirebaseAuth } from './config';

export class FirebaseAuthService {
  // Sign in with email and password
  static async signIn(email: string, password: string) {
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        return { user: null, error: "Firebase not configured" };
      }
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  }

  // Create new user with email and password
  static async signUp(email: string, password: string) {
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        return { user: null, error: "Firebase not configured" };
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  }

  // Sign out current user
  static async signOut() {
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        return { error: "Firebase not configured" };
      }
      await signOut(auth);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void) {
    const auth = getFirebaseAuth();
    if (!auth) {
      // Return a no-op unsubscribe function
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  }

  // Get current user
  static getCurrentUser() {
    const auth = getFirebaseAuth();
    return auth ? auth.currentUser : null;
  }
}