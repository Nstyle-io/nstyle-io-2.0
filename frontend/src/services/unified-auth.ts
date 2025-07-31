// Unified authentication service that works with both Firebase and Supabase
import { FirebaseAuthService } from '@/integrations/firebase';
import { supabase } from '@/integrations/supabase/client';
import { BackendSelector } from './backend-selector';

export interface AuthUser {
  id: string;
  email: string | null;
  provider: 'firebase' | 'supabase';
}

export interface AuthSession {
  user: AuthUser | null;
  token: string | null;
  error: string | null;
}

type AuthStateChangeCallback = (user: AuthUser | null) => void;

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
    } catch {
      // Firebase might not be initialized
    }

    // Try to sign out from Supabase
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        errors.push(`Supabase: ${error.message}`);
      }
    } catch {
      // Supabase might not be initialized
    }

    return {
      error: errors.length > 0 ? errors.join(', ') : null
    };
  }

  // Get current user from the active backend
  static async getCurrentUser(): Promise<AuthUser | null> {
    if (BackendSelector.isFirebase()) {
      const user = FirebaseAuthService.getCurrentUser();
      return user ? {
        id: user.uid,
        email: user.email,
        provider: 'firebase'
      } : null;
    } else {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Supabase getCurrentUser error:', error);
          return null;
        }
        return user ? {
          id: user.id,
          email: user.email,
          provider: 'supabase'
        } : null;
      } catch (error) {
        console.error('Supabase getCurrentUser exception:', error);
        return null;
      }
    }
  }

  // Get current session from the active backend
  static async getCurrentSession() {
    if (BackendSelector.isFirebase()) {
      const user = FirebaseAuthService.getCurrentUser();
      if (user) {
        try {
          const token = await user.getIdToken();
          return {
            user: {
              id: user.uid,
              email: user.email,
              provider: 'firebase' as const
            },
            token,
            error: null
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return {
            user: null,
            token: null,
            error: errorMessage
          };
        }
      }
      return { user: null, token: null, error: null };
    } else {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          return { user: null, token: null, error: error.message };
        }
        return {
          user: session?.user ? {
            id: session.user.id,
            email: session.user.email,
            provider: 'supabase' as const
          } : null,
          token: session?.access_token || null,
          error: null
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          user: null,
          token: null,
          error: errorMessage
        };
      }
    }
  }

  // Refresh authentication token
  static async refreshToken() {
    if (BackendSelector.isFirebase()) {
      const user = FirebaseAuthService.getCurrentUser();
      if (user) {
        try {
          const token = await user.getIdToken(true); // Force refresh
          return { token, error: null };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { token: null, error: errorMessage };
        }
      }
      return { token: null, error: 'No user found' };
    } else {
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        if (error) {
          return { token: null, error: error.message };
        }
        return { token: session?.access_token || null, error: null };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { token: null, error: errorMessage };
      }
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: AuthStateChangeCallback) {
    if (BackendSelector.isFirebase()) {
      return FirebaseAuthService.onAuthStateChanged((firebaseUser) => {
        const user = firebaseUser ? {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          provider: 'firebase' as const
        } : null;
        callback(user);
      });
    } else {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          const user = session?.user ? {
            id: session.user.id,
            email: session.user.email,
            provider: 'supabase' as const
          } : null;
          callback(user);
        }
      );
      return () => subscription.unsubscribe();
    }
  }

  // Validate token expiration
  static async isTokenValid(): Promise<boolean> {
    if (BackendSelector.isFirebase()) {
      const user = FirebaseAuthService.getCurrentUser();
      if (!user) return false;
      
      try {
        // Firebase SDK handles token validation internally
        await user.getIdToken();
        return true;
      } catch {
        return false;
      }
    } else {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        return !error && !!user;
      } catch {
        return false;
      }
    }
  }
}