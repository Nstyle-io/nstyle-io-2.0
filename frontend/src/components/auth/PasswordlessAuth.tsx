import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Smartphone, Key, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PasswordlessAuthProps {
  onSuccess?: () => void;
}

export const PasswordlessAuth: React.FC<PasswordlessAuthProps> = ({ onSuccess }) => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendOTP = async () => {
    if (!identifier.trim()) {
      toast({
        title: "Missing Information",
        description: `Please enter your ${authMethod}`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let result;
      
      if (authMethod === 'email') {
        result = await supabase.auth.signInWithOtp({
          email: identifier,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
      } else {
        result = await supabase.auth.signInWithOtp({
          phone: identifier
        });
      }

      if (result.error) throw result.error;

      setStep('verify');
      toast({
        title: "Verification Code Sent",
        description: `Check your ${authMethod} for the verification code`
      });
    } catch (error: unknown) {
      console.error('Error sending OTP:', error);
      const errorMessage = error instanceof Error ? error.message : `Failed to send verification code to ${authMethod}`;
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpCode.trim()) {
      toast({
        title: "Missing Code",
        description: "Please enter the verification code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let result;
      
      if (authMethod === 'email') {
        result = await supabase.auth.verifyOtp({
          email: identifier,
          token: otpCode,
          type: 'email'
        });
      } else {
        result = await supabase.auth.verifyOtp({
          phone: identifier,
          token: otpCode,
          type: 'sms'
        });
      }

      if (result.error) throw result.error;

      toast({
        title: "Success!",
        description: "You've been logged in successfully"
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error('Error verifying OTP:', error);
      const errorMessage = error instanceof Error ? error.message : "Invalid verification code";
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('input');
    setOtpCode('');
    setIdentifier('');
  };

  return (
    <Card className="glass-card max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          Passwordless Login
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {step === 'input' 
            ? `Enter your ${authMethod} to receive a verification code`
            : `Enter the code sent to your ${authMethod}`
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'input' ? (
          <>
            {/* Auth Method Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={authMethod === 'email' ? 'default' : 'outline'}
                onClick={() => setAuthMethod('email')}
                className="flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>
              <Button
                variant={authMethod === 'phone' ? 'default' : 'outline'}
                onClick={() => setAuthMethod('phone')}
                className="flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Phone
              </Button>
            </div>

            {/* Input Field */}
            <div className="space-y-2">
              <Label>
                {authMethod === 'email' ? 'Email Address' : 'Phone Number'}
              </Label>
              <Input
                type={authMethod === 'email' ? 'email' : 'tel'}
                placeholder={
                  authMethod === 'email' 
                    ? 'your@email.com' 
                    : '+1234567890'
                }
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Send Button */}
            <Button 
              onClick={sendOTP} 
              className="w-full" 
              disabled={loading || !identifier.trim()}
            >
              {loading ? (
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Send Verification Code
            </Button>
          </>
        ) : (
          <>
            {/* Verification Code Input */}
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                disabled={loading}
                maxLength={6}
              />
            </div>

            {/* Verify Button */}
            <Button 
              onClick={verifyOTP} 
              className="w-full" 
              disabled={loading || !otpCode.trim()}
            >
              {loading ? (
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : (
                <Key className="w-4 h-4 mr-2" />
              )}
              Verify & Login
            </Button>

            {/* Back Button */}
            <Button 
              variant="outline" 
              onClick={resetFlow} 
              className="w-full"
              disabled={loading}
            >
              Back
            </Button>

            {/* Resend Option */}
            <p className="text-center text-sm text-muted-foreground">
              Didn't receive the code?{' '}
              <button 
                onClick={sendOTP}
                disabled={loading}
                className="text-primary hover:underline"
              >
                Resend
              </button>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};