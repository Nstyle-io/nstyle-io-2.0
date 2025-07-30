import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Mail, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSocialAuth } from '@/hooks/useSocialAuth';
import { isAppleDevice } from '@/utils/deviceDetection';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithProvider } = useSocialAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showAppleOption, setShowAppleOption] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
  });

  // Check if user is already authenticated and detect device
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/');
          return;
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
    
    // Detect if user is on Apple device
    setShowAppleOption(isAppleDevice());

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (event === 'SIGNED_IN' && session) {
        // User successfully signed in (including via magic link)
        toast({
          title: "Welcome!",
          description: "You've successfully signed in.",
        });
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };


  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          shouldCreateUser: true,
        }
      });

      if (error) {
        console.error('Magic link error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to send verification email. Please try again.",
          variant: "destructive",
        });
      } else {
        setMagicLinkSent(true);
        toast({
          title: "Verification email sent!",
          description: "Check your email and click the link to sign in.",
        });
        console.log('Magic link sent successfully to:', formData.email);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-xl flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Nstyle
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Sign in to Nstyle</h1>
          <p className="text-muted-foreground text-sm">Welcome back! Please sign in to continue</p>
          <p className="text-xs text-muted-foreground mt-1">
            You'll stay signed in on this device
          </p>
        </div>

        {/* Email Authentication */}
        <div className="space-y-4">
          {!magicLinkSent ? (
            <>
              <form onSubmit={handleEmailVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="h-12 bg-background/10 border-border/20 focus:border-primary/50 rounded-lg"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium"
                >
                  {submitting ? 'Verifying...' : 'Verify'}
                </Button>
              </form>

              {/* Social Login Options */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-background text-muted-foreground">or continue with</span>
                  </div>
                </div>

                <div className={showAppleOption ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 border-border/20 hover:bg-background/10 rounded-lg"
                    onClick={async () => {
                      console.log('Google sign-in clicked');
                      const result = await signInWithProvider('google');
                      console.log('Google sign-in result:', result);
                    }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="ml-2">Google</span>
                  </Button>

                  {showAppleOption && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 border-border/20 hover:bg-background/10 rounded-lg"
                      onClick={() => signInWithProvider('apple')}
                    >
                      <Apple className="w-5 h-5 mr-2" />
                      Apple
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Check your email!</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a magic link to <span className="font-medium">{formData.email}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Click the link in the email to sign in instantly.
                </p>
                <div className="bg-muted/20 rounded-lg p-3 text-xs text-muted-foreground">
                  <p className="font-semibold mb-1">Didn't receive the email?</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check your spam or junk folder</li>
                    <li>Make sure the email address is correct</li>
                    <li>Wait a moment and check again</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="default"
                    onClick={async () => {
                      setSubmitting(true);
                      try {
                        const { error } = await supabase.auth.signInWithOtp({
                          email: formData.email,
                          options: {
                            emailRedirectTo: `${window.location.origin}/`,
                            shouldCreateUser: true,
                          }
                        });
                        if (!error) {
                          toast({
                            title: "Verification email resent!",
                            description: "Check your email for the new link.",
                          });
                        }
                      } catch (error) {
                        console.error('Resend error:', error);
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? 'Sending...' : 'Resend verification email'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMagicLinkSent(false);
                      setFormData({ ...formData, email: '' });
                    }}
                    className="w-full"
                  >
                    Try a different email
                  </Button>
                </div>
              </div>
            )}
        </div>

        {/* Sign up Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;