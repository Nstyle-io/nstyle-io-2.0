import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type SocialProvider = 'google' | 'facebook' | 'apple' | 'github' | 'twitter' | 'discord' | 'linkedin_oidc';

export const useSocialAuth = () => {
  const [loading, setLoading] = useState<Record<SocialProvider, boolean>>({
    google: false,
    facebook: false,
    apple: false,
    github: false,
    twitter: false,
    discord: false,
    linkedin_oidc: false,
  });
  const { toast } = useToast();

  const signInWithProvider = async (provider: SocialProvider) => {
    setLoading(prev => ({ ...prev, [provider]: true }));

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error(`${provider} authentication error:`, error);
      toast({
        title: "Authentication Error",
        description: error.message || `Failed to sign in with ${provider}`,
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  return {
    loading,
    signInWithProvider
  };
};