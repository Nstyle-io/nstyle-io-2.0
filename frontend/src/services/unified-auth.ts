// Unified authentication service that works with both Firebase and Supabase
import { FirebaseAuthService } from '@/integrations/firebase';
import { supabase } from '@/integrations/supabase/client';
import { BackendSelector } from './backend-selector';

export interface AuthUser {
  id: string;
  email: string | null;
  provider: 'firebase' | 'supabase';
}

export class UnifiedAuthService {
  // Sign in using the selected backend
  static async signIn(email: string, password: string) {
    if (BackendSelector.isFirebase()) {
      const result = await FirebaseAuthService.signIn(email, password);
      if (result.user) {
        return {
          user: {
            id: result.user.uid,
            email: result.user.email,
            provider: 'firebase' as const
          },
          error: null
        };
      }
      return { user: null, error: result.error };
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (data.user) {
        return {
          user: {
            id: data.user.id,
            email: data.user.email,
            provider: 'supabase' as const
          },
          error: null
        };
      }
      return { user: null, error: error?.message || 'Unknown error' };
    }
  }

  // Sign up using the selected backend
  static async signUp(email: string, password: string) {
    if (BackendSelector.isFirebase()) {
      const result = await FirebaseAuthService.signUp(email, password);
      if (result.user) {
        return {
          user: {
            id: result.user.uid,
            email: result.user.email,
            provider: 'firebase' as const
          },
          error: null
        };
      }
      return { user: null, error: result.error };
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (data.user) {
        return {
          user: {
            id: data.user.id,
            email: data.user.email,
            provider: 'supabase' as const
          },
          error: null
        };
      }
      return { user: null, error: error?.message || 'Unknown error' };
    }
  }

  // Sign out from both services
  static async signOut() {
    const errors: string[] = [];

    // Try to sign out from Firebase
    try {
      const firebaseResult = await FirebaseAuthService.signOut();
      if (firebaseResult.error) {
        errors.push(`Firebase: ${firebaseResult.error}`);
      }
    } catch (error) {
      // Firebase might not be initialized
    }

    // Try to sign out from Supabase
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        errors.push(`Supabase: ${error.message}`);
      }
    } catch (error) {
      // Supabase might not be initialized
    }

    return {
      error: errors.length > 0 ? errors.join(', ') : null
    };
  }

  // Get current user from the active backend
  static getCurrentUser(): AuthUser | null {
    if (BackendSelector.isFirebase()) {
      const user = FirebaseAuthService.getCurrentUser();
      return user ? {
        id: user.uid,
        email: user.email,
        provider: 'firebase'
      } : null;
    } else {
      // For Supabase, we'd need to get this from a context or hook
      // This is a simplified version
      return null;
    }
  }
}