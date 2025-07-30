import { useState } from 'react';
import { ArrowLeft, Moon, Sun, Bell, Lock, User, Palette, Globe, HelpCircle, LogOut, ChevronRight, Shield, CreditCard, Languages, Volume2, Eye, Smartphone, Download, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [language, setLanguage] = useState('english');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [downloadQuality, setDownloadQuality] = useState('high');
  const [isSigningOut, setIsSigningOut] = useState(false);

  const toggleTheme = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  };

  const settingsSections = [
    {
      title: 'Appearance & Display',
      icon: Palette,
      items: [
        {
          label: 'Dark Mode',
          description: 'Use dark theme for better viewing in low light',
          icon: darkMode ? Moon : Sun,
          type: 'switch' as const,
          value: darkMode,
          onChange: toggleTheme,
        },
        {
          label: 'Auto-play Videos',
          description: 'Automatically play videos in feed',
          type: 'switch' as const,
          value: autoPlay,
          onChange: setAutoPlay,
        },
        {
          label: 'Language',
          description: 'Choose your preferred language',
          icon: Languages,
          type: 'select' as const,
          value: language,
          onChange: setLanguage,
          options: [
            { value: 'english', label: 'English' },
            { value: 'spanish', label: 'Español' },
            { value: 'french', label: 'Français' },
            { value: 'german', label: 'Deutsch' },
          ],
        },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          label: 'Push Notifications',
          description: 'Get notified about likes, comments, and follows',
          type: 'switch' as const,
          value: pushNotifications,
          onChange: setPushNotifications,
        },
        {
          label: 'Email Notifications',
          description: 'Receive weekly digest and important updates',
          type: 'switch' as const,
          value: emailNotifications,
          onChange: setEmailNotifications,
        },
        {
          label: 'Sound & Vibration',
          description: 'Enable sounds and haptic feedback',
          icon: Volume2,
          type: 'switch' as const,
          value: soundEnabled,
          onChange: setSoundEnabled,
        },
      ],
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        {
          label: 'Private Account',
          description: 'Only approved followers can see your posts',
          type: 'switch' as const,
          value: privateAccount,
          onChange: setPrivateAccount,
        },
        {
          label: 'Two-Factor Authentication',
          description: 'Add an extra layer of security',
          icon: Lock,
          type: 'link' as const,
          action: () => {},
        },
        {
          label: 'Login Activity',
          description: "See where you're logged in",
          icon: Eye,
          type: 'link' as const,
          action: () => {},
        },
        {
          label: 'Blocked Users',
          description: 'Manage blocked accounts',
          type: 'link' as const,
          action: () => {},
        },
      ],
    },
    {
      title: 'Account & Billing',
      icon: User,
      items: [
        {
          label: 'Edit Profile',
          description: 'Change your profile information',
          type: 'link' as const,
          action: () => navigate('/edit-profile'),
        },
        {
          label: 'Account Settings',
          description: 'Email, password, and other account settings',
          type: 'link' as const,
          action: () => {},
        },
        {
          label: 'Subscription & Billing',
          description: 'Manage your Nstyle Pro subscription',
          icon: CreditCard,
          type: 'link' as const,
          action: () => {},
        },
        {
          label: 'Download Your Data',
          description: 'Get a copy of your data',
          icon: Download,
          type: 'link' as const,
          action: () => {},
        },
      ],
    },
    {
      title: 'App Preferences',
      icon: Smartphone,
      items: [
        {
          label: 'Download Quality',
          description: 'Choose video and image quality for downloads',
          type: 'select' as const,
          value: downloadQuality,
          onChange: setDownloadQuality,
          options: [
            { value: 'low', label: 'Low (Save Data)' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'original', label: 'Original Quality' },
          ],
        },
      ],
    },
    {
      title: 'Support & Legal',
      icon: HelpCircle,
      items: [
        {
          label: 'Help Center',
          description: 'Get help and support',
          type: 'link' as const,
          action: () => navigate('/help-center'),
        },
        {
          label: 'Report a Problem',
          description: 'Let us know about any issues',
          type: 'link' as const,
          action: () => {},
        },
        {
          label: 'Terms of Service',
          description: 'Read our terms and conditions',
          type: 'link' as const,
          action: () => navigate('/terms-of-service'),
        },
        {
          label: 'Privacy Policy',
          description: 'Learn how we protect your privacy',
          type: 'link' as const,
          action: () => navigate('/privacy-policy'),
        },
        {
          label: 'About',
          description: 'App version and information',
          type: 'link' as const,
          action: () => {},
        },
      ],
    },
  ];

  return (
    <ResponsiveLayout>
      <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>

          {/* Settings Sections */}
          <div className="space-y-4">
            {settingsSections.map((section) => {
              const SectionIcon = section.icon;
              
              return (
                <Card key={section.title} className="glass-card border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-3 text-lg">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <SectionIcon className="w-5 h-5 text-primary" />
                      </div>
                      <span>{section.title}</span>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {section.items.map((item, index) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              {item.icon && (
                                <item.icon className="w-4 h-4 text-muted-foreground" />
                              )}
                              <div>
                                <Label className="font-medium cursor-pointer">{item.label}</Label>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {item.type === 'switch' && (
                            <Switch
                              checked={item.value}
                              onCheckedChange={item.onChange}
                            />
                          )}

                          {item.type === 'select' && (
                            <Select value={item.value} onValueChange={item.onChange}>
                              <SelectTrigger className="w-40 glass-card border-white/10 bg-background/60 z-50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="glass-card border-white/10 bg-background/95 backdrop-blur-xl z-50">
                                {item.options?.map((option) => (
                                  <SelectItem key={option.value} value={option.value} className="focus:bg-primary/20">
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {item.type === 'link' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={item.action}
                              className="hover:bg-primary/20"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {index < section.items.length - 1 && (
                          <Separator className="mt-4 bg-white/10" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}

            {/* App Info */}
            <Card className="glass-card border-white/10">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl">Nstyle</h3>
                  <p className="text-sm text-muted-foreground">Version 1.0.0</p>
                  <p className="text-xs text-muted-foreground">
                    Made with 💅 for nail enthusiasts worldwide
                  </p>
                  <p className="text-xs text-muted-foreground pt-2">
                    © 2024 Nstyle. All rights reserved.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Logout */}
            <Card className="glass-card border-destructive/20">
              <CardContent className="pt-6">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={async () => {
                    setIsSigningOut(true);
                    try {
                      const { error } = await supabase.auth.signOut();
                      if (error) {
                        toast({
                          title: "Error",
                          description: "Failed to sign out. Please try again.",
                          variant: "destructive",
                        });
                      } else {
                        toast({
                          title: "Signed Out",
                          description: "You have been successfully signed out.",
                        });
                        navigate('/login');
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "An unexpected error occurred.",
                        variant: "destructive",
                      });
                    } finally {
                      setIsSigningOut(false);
                    }
                  }}
                  disabled={isSigningOut}
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isSigningOut ? 'Signing Out...' : 'Log Out'}</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
    </ResponsiveLayout>
  );
};

export default Settings;