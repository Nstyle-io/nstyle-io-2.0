import { useEffect, useState } from 'react';
import { UnifiedAuthService, AuthUser } from '@/services/unified-auth';
import { BackendSelector } from '@/services/backend-selector';

export const useUnifiedAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = UnifiedAuthService.onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
      setError(null);
    });

    // Check for existing session
    const checkCurrentUser = async () => {
      try {
        const currentUser = await UnifiedAuthService.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setLoading(false);
      }
    };

    checkCurrentUser();

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await UnifiedAuthService.signIn(email, password);
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      return { success: true, user: result.user };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await UnifiedAuthService.signUp(email, password);
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      return { success: true, user: result.user };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await UnifiedAuthService.signOut();
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const result = await UnifiedAuthService.refreshToken();
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      return { success: true, token: result.token };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const switchBackend = (provider: 'firebase' | 'supabase') => {
    BackendSelector.setProvider(provider);
    // Force a re-check of the current user after switching
    UnifiedAuthService.getCurrentUser().then(setUser);
  };

  const validateToken = async () => {
    try {
      return await UnifiedAuthService.isTokenValid();
    } catch {
      return false;
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refreshToken,
    switchBackend,
    validateToken,
    currentBackend: BackendSelector.getProvider(),
    isFirebase: BackendSelector.isFirebase(),
    isSupabase: BackendSelector.isSupabase(),
  };
};