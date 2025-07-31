import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface BiometricSupport {
  available: boolean;
  type: 'fingerprint' | 'face' | 'voice' | 'none';
}

export const useBiometricAuth = () => {
  const [biometricSupport, setBiometricSupport] = useState<BiometricSupport>({
    available: false,
    type: 'none'
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      // Check for WebAuthn support
      if (!window.PublicKeyCredential) {
        setBiometricSupport({ available: false, type: 'none' });
        return;
      }

      // Check if we're in an iframe (like Lovable preview)
      if (window.self !== window.top) {
        console.warn('Biometric authentication is not available in iframe contexts due to security policies');
        setBiometricSupport({ available: false, type: 'none' });
        return;
      }

      // Check if platform authenticator is available (Touch ID, Face ID, Windows Hello, etc.)
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      if (available) {
        // Try to determine the type of biometric
        const userAgent = navigator.userAgent.toLowerCase();
        let type: BiometricSupport['type'] = 'fingerprint';
        
        if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
          type = 'face'; // Assume Face ID for newer iOS devices
        } else if (userAgent.includes('android')) {
          type = 'fingerprint'; // Most Android devices use fingerprint
        } else if (userAgent.includes('windows')) {
          type = 'face'; // Windows Hello often uses face recognition
        }

        setBiometricSupport({ available: true, type });
      } else {
        setBiometricSupport({ available: false, type: 'none' });
      }
    } catch (error) {
      console.error('Error checking biometric support:', error);
      setBiometricSupport({ available: false, type: 'none' });
    }
  };

  const authenticateWithBiometrics = async (_userEmail: string = 'user@example.com') => {
    if (!biometricSupport.available) {
      toast({
        title: "Biometric Authentication Unavailable",
        description: "Your device doesn't support biometric authentication",
        variant: "destructive"
      });
      return { success: false, error: 'Biometric authentication not available' };
    }

    setIsAuthenticating(true);

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [],
        userVerification: 'required',
        timeout: 60000,
      };

      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (credential) {
        toast({
          title: "Authentication Successful",
          description: `Authenticated using ${biometricSupport.type}`,
        });
        return { success: true, credential };
      }
    } catch (error: unknown) {
      console.error('Biometric authentication error:', error);
      
      let errorMessage = 'Biometric authentication failed';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Authentication was cancelled or not allowed';
        } else if (error.name === 'AbortError') {
          errorMessage = 'Authentication was aborted';
        }
      }

      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setIsAuthenticating(false);
    }

    return { success: false, error: 'Unknown error occurred' };
  };

  const registerBiometric = async (userEmail: string) => {
    if (!biometricSupport.available) {
      return { success: false, error: 'Biometric authentication not available' };
    }

    setIsAuthenticating(true);

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const userId = new TextEncoder().encode(userEmail);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "Nstyle",
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: userEmail,
          displayName: userEmail,
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "direct"
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (credential) {
        // Store credential ID for future use
        localStorage.setItem('biometric_credential', credential.id);
        
        toast({
          title: "Biometric Registration Successful",
          description: `${biometricSupport.type} authentication is now set up`,
        });
        return { success: true, credential };
      }
    } catch (error: unknown) {
      console.error('Biometric registration error:', error);
      toast({
        title: "Registration Failed",
        description: "Failed to register biometric authentication",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setIsAuthenticating(false);
    }

    return { success: false, error: 'Unknown error occurred' };
  };

  return {
    biometricSupport,
    isAuthenticating,
    authenticateWithBiometrics,
    registerBiometric,
    checkBiometricSupport
  };
};