import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedAuthService, AuthUser } from '@/services/unified-auth';
import { BackendSelector } from '@/services/backend-selector';
import { usePageVisibility } from '@/hooks/usePageVisibility';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard = ({ children, requireAuth = true }: AuthGuardProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const isVisible = usePageVisibility();
  const abortControllerRef = useRef<AbortController | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    console.log('AuthGuard: Setting up unified auth listener');
    
    // Create new abort controller for this effect
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    // Set up unified auth state listener
    const unsubscribe = UnifiedAuthService.onAuthStateChange((authUser) => {
      if (signal.aborted) return;
      
      console.log('AuthGuard: Auth state changed', { 
        hasUser: !!authUser, 
        provider: authUser?.provider,
        backend: BackendSelector.getProvider()
      });
      
      setUser(authUser);
      setLoading(false);
      setAuthError(null);
      
      // If user signed out, navigate to login
      if (!authUser && requireAuth) {
        navigate('/login');
      }
    });

    unsubscribeRef.current = unsubscribe;

    // Check for existing session with proper error handling
    const checkSession = async () => {
      if (signal.aborted) return;
      
      try {
        const currentUser = await UnifiedAuthService.getCurrentUser();
        
        if (signal.aborted) return;
        
        console.log('AuthGuard: Initial session check', { 
          hasUser: !!currentUser,
          provider: currentUser?.provider,
          backend: BackendSelector.getProvider()
        });
        
        setUser(currentUser);
        setLoading(false);
        setAuthError(null);
      } catch (error) {
        if (signal.aborted) return;
        
        console.error('AuthGuard: Error checking session', error);
        setAuthError('Failed to verify authentication');
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [navigate, requireAuth]);

  // Check if user needs profile setup
  useEffect(() => {
    const checkProfileSetup = async () => {
      if (user && !loading && requireAuth) {
        // Skip profile check if we're already on profile setup page
        if (window.location.pathname === '/profile-setup') {
          return;
        }

        setProfileLoading(true);
        try {
          // Only check profile setup for Supabase users
          // Firebase users might use a different profile system or skip this step
          if (user.provider === 'supabase') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_setup_complete')
              .eq('user_id', user.id)
              .single();
            
            if (!profile?.is_setup_complete) {
              console.log('AuthGuard: Supabase profile not complete, redirecting to profile setup');
              navigate('/profile-setup');
              return;
            }
          } else {
            // For Firebase users, we might implement a different profile check or skip it
            console.log('AuthGuard: Firebase user detected, skipping Supabase profile check');
          }
        } catch (error) {
          console.error('AuthGuard: Error checking profile setup:', error);
        } finally {
          setProfileLoading(false);
        }
      }
    };

    checkProfileSetup();
  }, [user, loading, requireAuth, navigate]);

  useEffect(() => {
    console.log('AuthGuard: Navigation effect', { loading, requireAuth, hasUser: !!user });
    if (!loading && !profileLoading) {
      if (requireAuth && !user) {
        console.log('AuthGuard: Redirecting to login');
        // Redirect to login if auth is required but user is not logged in
        navigate('/login');
      } else if (!requireAuth && user && window.location.pathname === '/') {
        console.log('AuthGuard: Redirecting authenticated user to feed');
        // Redirect authenticated users from landing page to feed
        navigate('/feed');
      }
    }
  }, [user, loading, profileLoading, requireAuth, navigate]);

  // Reset loading state when page becomes visible again
  useEffect(() => {
    if (isVisible && loading) {
      // If page becomes visible and we're still loading, force a session check
      const checkSessionAgain = async () => {
        try {
          const currentUser = await UnifiedAuthService.getCurrentUser();
          setUser(currentUser);
          setLoading(false);
        } catch (error) {
          console.error('AuthGuard: Error rechecking session', error);
          setLoading(false);
        }
      };
      checkSessionAgain();
    }
  }, [isVisible, loading]);

  // Show error state if authentication failed
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Authentication Error</div>
          <div className="text-white mb-4">{authError}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show loading spinner while checking auth or profile
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If auth is required and user is not logged in, don't render children
  if (requireAuth && !user) {
    return null;
  }

  return <>{children}</>;
};