import { useState, useEffect } from 'react';
import { ArrowLeft, Save, User, Mail, MapPin, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { ProfilePictureUpload } from '@/components/camera/ProfilePictureUpload';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EditProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [profileData, setProfileData] = useState({
    display_name: '',
    username: '',
    bio: '',
    location: '',
    website_url: '',
    avatar_url: '',
    // Privacy settings
    is_private: false,
    allow_messages_from: 'everyone' as 'everyone' | 'followers' | 'no_one',
    story_visibility: 'public' as 'public' | 'followers' | 'private',
    show_email_publicly: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        await fetchProfile(user.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData({
          display_name: data.display_name || '',
          username: data.username || '',
          bio: data.bio || '',
          location: data.location || '',
          website_url: data.website_url || '',
          avatar_url: data.avatar_url || '',
          is_private: data.is_private || false,
          allow_messages_from: (data.allow_messages_from as 'everyone' | 'followers' | 'no_one') || 'everyone',
          story_visibility: (data.story_visibility as 'public' | 'followers' | 'private') || 'public',
          show_email_publicly: data.show_email_publicly || false,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profileData.display_name,
          username: profileData.username,
          bio: profileData.bio,
          location: profileData.location,
          website_url: profileData.website_url,
          is_private: profileData.is_private,
          allow_messages_from: profileData.allow_messages_from,
          story_visibility: profileData.story_visibility,
          show_email_publicly: profileData.show_email_publicly,
        })
        .eq('user_id', currentUserId);

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpdate = (url: string) => {
    setProfileData(prev => ({ ...prev, avatar_url: url }));
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <main className="pt-16 pb-20 md:pb-4">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold">Edit Profile</h1>
            </div>
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>

          <div className="space-y-6">
            {/* Profile Picture */}
            <ProfilePictureUpload
              currentAvatarUrl={profileData.avatar_url}
              onAvatarUpdate={handleAvatarUpdate}
              userId={currentUserId}
            />

            {/* Basic Information */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-semibold mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={profileData.display_name}
                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                    placeholder="Your display name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profileData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="@username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="pl-10"
                      placeholder="Your city"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website_url">Website</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website_url"
                      value={profileData.website_url}
                      onChange={(e) => handleInputChange('website_url', e.target.value)}
                      className="pl-10"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-semibold mb-4">Privacy Settings</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Private Account</Label>
                    <p className="text-sm text-muted-foreground">
                      When your account is private, only people you approve can follow you and see your posts
                    </p>
                  </div>
                  <Switch
                    checked={profileData.is_private}
                    onCheckedChange={(checked) => handleInputChange('is_private', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">Who can message you</Label>
                  <Select
                    value={profileData.allow_messages_from}
                    onValueChange={(value) => handleInputChange('allow_messages_from', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Everyone</SelectItem>
                      <SelectItem value="followers">People you follow</SelectItem>
                      <SelectItem value="no_one">No one</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">Story visibility</Label>
                  <Select
                    value={profileData.story_visibility}
                    onValueChange={(value) => handleInputChange('story_visibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="followers">Followers only</SelectItem>
                      <SelectItem value="private">Only me</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Show email publicly</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your email address on your public profile
                    </p>
                  </div>
                  <Switch
                    checked={profileData.show_email_publicly}
                    onCheckedChange={(checked) => handleInputChange('show_email_publicly', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default EditProfile;