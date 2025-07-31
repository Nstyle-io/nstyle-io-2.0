# Dual Authentication System

This document explains the dual authentication system implementation that supports both Firebase and Supabase backends.

## Architecture Overview

The authentication system consists of several key components:

### Core Services

1. **BackendSelector** (`/services/backend-selector.ts`)
   - Manages which backend (Firebase or Supabase) is currently active
   - Persists selection to localStorage for consistency across sessions
   - Provides methods to check current backend and switch between them

2. **UnifiedAuthService** (`/services/unified-auth.ts`)
   - Provides a unified interface for authentication operations
   - Abstracts backend-specific implementations behind common methods
   - Handles user management, token refresh, and auth state changes

3. **AuthGuard** (`/components/auth/AuthGuard.tsx`)
   - Updated to work with the unified authentication service
   - Manages route protection and authentication state
   - Handles profile setup checks for Supabase users

### Helper Components

4. **useUnifiedAuth Hook** (`/hooks/useUnifiedAuth.tsx`)
   - React hook that provides easy access to authentication functionality
   - Manages loading states, errors, and authentication operations
   - Provides methods for sign-in, sign-up, sign-out, and backend switching

5. **AuthTest Component** (`/components/auth/AuthTest.tsx`)
   - Test component for verifying authentication functionality
   - Allows switching between backends and testing auth operations
   - Useful for development and debugging

## Key Features

### 1. Backend Selection
- Users can dynamically switch between Firebase and Supabase
- Selection is persisted in localStorage
- State synchronization ensures consistency

### 2. Unified Authentication Interface
- Common methods for sign-in, sign-up, and sign-out
- Consistent user object structure across backends
- Token management and refresh logic

### 3. Auth State Management
- Real-time auth state changes
- Proper cleanup of listeners and subscriptions
- Consistent state across components

### 4. Token Validation and Refresh
- Automatic token validation
- Refresh token logic for both backends
- Proper error handling for expired tokens

## API Reference

### BackendSelector

```typescript
// Set the active backend
BackendSelector.setProvider('firebase' | 'supabase');

// Get the current backend
const provider = BackendSelector.getProvider();

// Check specific backend
const isFirebase = BackendSelector.isFirebase();
const isSupabase = BackendSelector.isSupabase();
```

### UnifiedAuthService

```typescript
// Authentication operations
const { user, error } = await UnifiedAuthService.signIn(email, password);
const { user, error } = await UnifiedAuthService.signUp(email, password);
const { error } = await UnifiedAuthService.signOut();

// User and session management
const user = await UnifiedAuthService.getCurrentUser();
const { user, token, error } = await UnifiedAuthService.getCurrentSession();

// Token management
const { token, error } = await UnifiedAuthService.refreshToken();
const isValid = await UnifiedAuthService.isTokenValid();

// Auth state listening
const unsubscribe = UnifiedAuthService.onAuthStateChange((user) => {
  console.log('Auth state changed:', user);
});
```

### useUnifiedAuth Hook

```typescript
const {
  user,                    // Current authenticated user
  loading,                 // Loading state
  error,                   // Error message
  signIn,                  // Sign in function
  signUp,                  // Sign up function
  signOut,                 // Sign out function
  refreshToken,            // Refresh token function
  switchBackend,           // Switch backend function
  validateToken,           // Validate token function
  currentBackend,          // Current backend ('firebase' | 'supabase')
  isFirebase,              // Boolean: is Firebase active
  isSupabase,              // Boolean: is Supabase active
} = useUnifiedAuth();
```

## User Object Structure

The unified user object has a consistent structure regardless of backend:

```typescript
interface AuthUser {
  id: string;                        // User ID
  email: string | null;              // User email
  provider: 'firebase' | 'supabase'; // Backend provider
}
```

## Migration Guide

### For Existing Components

To migrate existing components using Supabase auth directly:

1. **Replace direct Supabase imports:**
   ```typescript
   // Old
   import { supabase } from '@/integrations/supabase/client';
   
   // New
   import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
   ```

2. **Update authentication logic:**
   ```typescript
   // Old
   const { data: { user } } = await supabase.auth.getUser();
   
   // New
   const { user } = useUnifiedAuth();
   ```

3. **Update auth state listening:**
   ```typescript
   // Old
   supabase.auth.onAuthStateChange((event, session) => {
     setUser(session?.user ?? null);
   });
   
   // New
   const { user } = useUnifiedAuth(); // Automatically managed
   ```

## Backend-Specific Considerations

### Firebase
- Uses Firebase Authentication SDK
- Token refresh handled automatically by Firebase
- User creation doesn't require email confirmation by default

### Supabase  
- Uses Supabase Auth
- Manual token refresh implementation
- Profile setup checks only apply to Supabase users
- Email confirmation may be required based on configuration

## Error Handling

The system provides consistent error handling across backends:

- Network errors are caught and properly formatted
- Authentication failures return descriptive error messages
- Token refresh failures are handled gracefully
- Missing configuration errors are reported clearly

## Security Considerations

1. **Token Storage**: Tokens are managed by the respective SDKs
2. **HTTPS Only**: Ensure all authentication happens over HTTPS
3. **Environment Variables**: Store sensitive configuration in environment variables
4. **Token Expiration**: Implement proper token refresh logic
5. **CORS Configuration**: Ensure proper CORS settings for both backends

## Testing

Use the `AuthTest` component to verify functionality:

1. Add the component to a test page
2. Switch between backends
3. Test sign-in/sign-out operations
4. Verify token validation
5. Check auth state persistence

## Production Deployment

1. **Environment Configuration**: Set up proper environment variables for both Firebase and Supabase
2. **Database Setup**: Ensure Supabase database schema includes profiles table
3. **Firebase Configuration**: Configure Firebase project with proper authentication providers
4. **CORS Settings**: Configure CORS for both backends
5. **Monitoring**: Set up monitoring for authentication errors and failures

## Troubleshooting

### Common Issues

1. **Backend not switching**: Check localStorage and browser cache
2. **Token refresh failures**: Verify environment configuration
3. **AuthGuard loops**: Check authentication state and routing logic
4. **Profile setup issues**: Ensure Supabase profiles table exists

### Debug Tools

- Use browser dev tools to inspect localStorage
- Check network tab for authentication requests
- Use the AuthTest component for debugging
- Enable console logging for auth state changes