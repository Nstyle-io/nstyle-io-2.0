// Test component to verify dual authentication system
import { useState } from 'react';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

export const AuthTest = () => {
  const { 
    user, 
    loading, 
    error, 
    signIn, 
    signOut, 
    switchBackend, 
    currentBackend,
    validateToken 
  } = useUnifiedAuth();
  
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const handleSignIn = async () => {
    const result = await signIn(email, password);
    console.log('Sign in result:', result);
  };

  const handleSignOut = async () => {
    const result = await signOut();
    console.log('Sign out result:', result);
  };

  const handleValidateToken = async () => {
    const isValid = await validateToken();
    setTokenValid(isValid);
    console.log('Token valid:', isValid);
  };

  const handleSwitchBackend = (provider: 'firebase' | 'supabase') => {
    switchBackend(provider);
    setTokenValid(null); // Reset token validation state
  };

  if (loading) {
    return <div className="p-4">Loading authentication...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Dual Auth System Test</h2>
      
      {/* Backend Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Current Backend: {currentBackend}</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleSwitchBackend('supabase')}
            className={`px-3 py-1 rounded text-sm ${
              currentBackend === 'supabase' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Supabase
          </button>
          <button
            onClick={() => handleSwitchBackend('firebase')}
            className={`px-3 py-1 rounded text-sm ${
              currentBackend === 'firebase' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Firebase
          </button>
        </div>
      </div>

      {/* User Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <strong>User Status:</strong>
        {user ? (
          <div className="mt-1">
            <div>ID: {user.id}</div>
            <div>Email: {user.email}</div>
            <div>Provider: {user.provider}</div>
          </div>
        ) : (
          <div className="mt-1 text-gray-500">Not authenticated</div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {/* Auth Actions */}
      {!user ? (
        <div className="space-y-3">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <button
            onClick={handleSignIn}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Sign In
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleSignOut}
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
          <button
            onClick={handleValidateToken}
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
          >
            Validate Token
          </button>
          {tokenValid !== null && (
            <div className={`p-2 rounded text-center ${
              tokenValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              Token is {tokenValid ? 'valid' : 'invalid'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};