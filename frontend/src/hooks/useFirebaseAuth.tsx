import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { FirebaseAuthService } from '@/integrations/firebase';

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = FirebaseAuthService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const result = await FirebaseAuthService.signIn(email, password);
    setLoading(false);
    return result;
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    const result = await FirebaseAuthService.signUp(email, password);
    setLoading(false);
    return result;
  };

  const signOut = async () => {
    setLoading(true);
    const result = await FirebaseAuthService.signOut();
    setLoading(false);
    return result;
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut
  };
};