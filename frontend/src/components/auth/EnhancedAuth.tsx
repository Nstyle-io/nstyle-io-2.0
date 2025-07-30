import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Lock, 
  Fingerprint, 
  Eye, 
  EyeOff,
  Smartphone,
  Github,
  MessageCircle,
  Linkedin,
  Apple,
  Chrome
} from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useSocialAuth } from '@/hooks/useSocialAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnhancedAuthProps {
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export const EnhancedAuth: React.FC<EnhancedAuthProps> = ({
  onSuccess,
  title = "Welcome to Nstyle",
  description = "Sign in to access your account"
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('email');
  
  const { biometricSupport, isAuthenticating, authenticateWithBiometrics, registerBiometric } = useBiometricAuth();
  const { loading: socialLoading, signInWithProvider } = useSocialAuth();
  const { toast } = useToast();

  const handleEmailAuth = async (isSignUp = false) => {
    console.log('handleEmailAuth called', { isSignUp, email, hasPassword: !!password });
    
    if (!email || !password) {
      console.log('Missing email or password');
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    console.log('Starting authentication attempt');

    try {
      console.log('Calling Supabase auth method');
      const { data, error } = isSignUp 
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
            },
          })
        : await supabase.auth.signInWithPassword({
            email,
            password,
          });

      console.log('Supabase response:', { data: !!data, error: error?.message });

      if (error) {
        throw error;
      }

      if (isSignUp && !data.user?.email_confirmed_at) {
        toast({
          title: "Check Your Email",
          description: "We've sent you a confirmation link",
        });
      } else {
        toast({
          title: "Success",
          description: isSignUp ? "Account created successfully!" : "Welcome back!",
        });
        
        onSuccess?.();
      }
    } catch (error: unknown) {
      console.error('Authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      toast({
        title: isSignUp ? "Sign Up Error" : "Sign In Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      console.log('Authentication attempt completed');
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    const result = await authenticateWithBiometrics(email || 'user@example.com');
    if (result.success) {
      onSuccess?.();
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'facebook' | 'twitter') => {
    const result = await signInWithProvider(provider);
    if (result.success) {
      onSuccess?.();
    }
  };

  const getBiometricIcon = () => {
    switch (biometricSupport.type) {
      case 'face':
        return <Eye className="w-5 h-5" />;
      case 'fingerprint':
        return <Fingerprint className="w-5 h-5" />;
      default:
        return <Smartphone className="w-5 h-5" />;
    }
  };

  const getBiometricText = () => {
    switch (biometricSupport.type) {
      case 'face':
        return 'Face ID';
      case 'fingerprint':
        return 'Fingerprint';
      default:
        return 'Biometric';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto glass-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="biometric" disabled={!biometricSupport.available}>
              Biometric
            </TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-3"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={() => handleEmailAuth(false)} 
                className="w-full btn-gradient" 
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
              <Button 
                onClick={() => handleEmailAuth(true)} 
                variant="outline" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="biometric" className="space-y-4">
            <div className="text-center space-y-4">
              <div className="flex flex-col items-center space-y-2">
                {getBiometricIcon()}
                <h3 className="font-semibold">{getBiometricText()} Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Use your {biometricSupport.type} to sign in securely
                </p>
              </div>

              <Button 
                onClick={handleBiometricAuth}
                className="w-full btn-gradient"
                disabled={isAuthenticating}
                size="lg"
              >
                {isAuthenticating ? 'Authenticating...' : `Use ${getBiometricText()}`}
              </Button>

              {email && (
                <Button 
                  onClick={() => registerBiometric(email)}
                  variant="outline"
                  className="w-full"
                  disabled={isAuthenticating}
                >
                  Set Up {getBiometricText()}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSocialAuth('google')}
                disabled={socialLoading.google}
                className="glass-card border-white/10 hover:border-primary/30"
              >
                <Chrome className="w-4 h-4 mr-2" />
                Google
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSocialAuth('apple')}
                disabled={socialLoading.apple}
                className="glass-card border-white/10 hover:border-primary/30"
              >
                <Apple className="w-4 h-4 mr-2" />
                Apple
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSocialAuth('github')}
                disabled={socialLoading.github}
                className="glass-card border-white/10 hover:border-primary/30"
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSocialAuth('discord')}
                disabled={socialLoading.discord}
                className="glass-card border-white/10 hover:border-primary/30"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Discord
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSocialAuth('facebook')}
                disabled={socialLoading.facebook}
                className="glass-card border-white/10 hover:border-primary/30 bg-blue-600/10 hover:bg-blue-600/20"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSocialAuth('linkedin_oidc')}
                disabled={socialLoading.linkedin_oidc}
                className="glass-card border-white/10 hover:border-primary/30 bg-blue-700/10 hover:bg-blue-700/20"
              >
                <Linkedin className="w-4 h-4 mr-2" />
                LinkedIn
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSocialAuth('twitter')}
                disabled={socialLoading.twitter}
                className="glass-card border-white/10 hover:border-primary/30"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {biometricSupport.available && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-primary/20">
                {getBiometricText()} Available
              </Badge>
              <span className="text-xs text-muted-foreground">
                Quick and secure authentication
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};