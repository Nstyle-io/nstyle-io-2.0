import { useState, useEffect, useCallback } from 'react';
import { Settings, Grid, Bookmark, Users, MapPin, Link, Calendar, Star, Edit, Store, Camera, MessageCircle } from 'lucide-react';
import { FollowButton } from '@/components/social/FollowButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import UserGallery from '@/components/gallery/UserGallery';
import { SocialFeed } from '@/components/social/SocialFeed';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import nailArt1 from '@/assets/nail-art-1.jpg';
import heroNails from '@/assets/hero-nails.jpg';
import salonInterior from '@/assets/salon-interior.jpg';

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website_url: string | null;
  location: string | null;
  user_type: string | null;
  created_at: string;
}

interface SalonProfile {
  id: string;
  salon_name: string;
  owner_id: string;
}

// Posts will be fetched from the database using the SocialFeed component

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId } = useParams();
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [salonProfile, setSalonProfile] = useState<SalonProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });

  const isOwnProfile = !userId || userId === currentUserId;
  const profileUserId = userId || currentUserId;

  const fetchStats = useCallback(async (targetUserId: string) => {
    try {
      // Fetch posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId);

      // Fetch followers count
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

      // Fetch following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId);

      setStats({
        posts: postsCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [userId, fetchUserProfile]);

  useEffect(() => {
    if (profileUserId) {
      fetchStats(profileUserId);

      // Set up real-time subscriptions for live updates
      const followsChannel = supabase
        .channel('profile-follows-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'follows' }, 
          () => fetchStats(profileUserId)
        )
        .subscribe();

      const postsChannel = supabase
        .channel('profile-posts-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'posts' }, 
          () => fetchStats(profileUserId)
        )
        .subscribe();

      const profilesChannel = supabase
        .channel('profile-changes')
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'profiles' }, 
          (payload) => {
            if (payload.new.user_id === profileUserId) {
              setProfile(payload.new as UserProfile);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(followsChannel);
        supabase.removeChannel(postsChannel);
        supabase.removeChannel(profilesChannel);
      };
    }
  }, [profileUserId, fetchStats]);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      setCurrentUserId(user.id);
      const targetUserId = userId || user.id;

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
        return;
      }

      setProfile(profileData);

      // If user is salon owner, fetch salon profile
      if (profileData.user_type === 'salon_owner') {
        const { data: salonData } = await supabase
          .from('salon_profiles')
          .select('id, salon_name, owner_id')
          .eq('owner_id', targetUserId)
          .single();
        
        setSalonProfile(salonData);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ResponsiveLayout>
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  if (!profile) {
    return (
      <ResponsiveLayout>
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
            <Button onClick={() => navigate('/profile-setup')}>
              Complete Profile Setup
            </Button>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="container mx-auto px-2 sm:px-4 max-w-4xl">
          {/* Profile Header */}
          <div className="glass-card p-3 sm:p-6 rounded-2xl mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Avatar */}
              <div className="relative flex justify-center sm:justify-start">
                <img
                  src={profile.avatar_url || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200'}
                  alt={profile.display_name || 'User'}
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full object-cover ring-4 ring-primary/20"
                />
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center">
                  <Star className="w-3 h-3 sm:w-5 sm:h-5 text-primary-foreground" fill="currentColor" />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold">{profile.display_name || 'User'}</h1>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-muted-foreground text-sm">@{profile.username || 'user'}</span>
                      <Badge variant="secondary" className="text-xs">
                        {profile.user_type === 'salon_owner' ? 'Salon Owner' : 'Enthusiast'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 sm:mt-0 justify-center sm:justify-start">
                    {isOwnProfile ? (
                      <>
                        {profile.user_type === 'salon_owner' && salonProfile && (
                          <Button 
                            onClick={() => navigate('/salon-dashboard')}
                            className="btn-gradient text-xs sm:text-sm"
                            size="sm"
                          >
                            <Store className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Salon Dashboard</span>
                            <span className="sm:hidden">Dashboard</span>
                          </Button>
                        )}
                        <Button variant="outline" onClick={() => navigate('/edit-profile')} size="sm" className="text-xs sm:text-sm">
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Edit Profile</span>
                          <span className="sm:hidden">Edit</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate('/privacy-settings')}>
                          <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <FollowButton
                          targetUserId={profile.user_id}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/messages?user=${profile.user_id}`)}
                          className="text-xs sm:text-sm"
                        >
                          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span>Message</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex space-x-4 sm:space-x-8 mb-4">
                  <div className="text-center">
                    <div className="font-bold text-lg">{stats.posts}</div>
                    <div className="text-muted-foreground text-xs sm:text-sm">Posts</div>
                  </div>
                  <div className="text-center cursor-pointer hover:text-primary transition-colors">
                    <div className="font-bold text-lg">{stats.followers}</div>
                    <div className="text-muted-foreground text-xs sm:text-sm">Followers</div>
                  </div>
                  <div className="text-center cursor-pointer hover:text-primary transition-colors">
                    <div className="font-bold text-lg">{stats.following}</div>
                    <div className="text-muted-foreground text-xs sm:text-sm">Following</div>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <p className="whitespace-pre-line text-sm">{profile.bio || 'No bio added yet.'}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    {profile.website_url && (
                      <div className="flex items-center space-x-1">
                        <Link className="w-4 h-4" />
                        <span className="text-primary hover:underline cursor-pointer">
                          {profile.website_url}
                        </span>
                      </div>
                    )}
                    {profile.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                  
                  {/* Salon Profile Link */}
                  {profile.user_type === 'salon_owner' && salonProfile && (
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate(`/salon/${salonProfile.id}`)}
                        className="text-sm"
                      >
                        <Store className="w-4 h-4 mr-2" />
                        View {salonProfile.salon_name}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 glass-card">
              <TabsTrigger value="posts" className="flex items-center space-x-1 sm:space-x-2">
                <Grid className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Posts</span>
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center space-x-1 sm:space-x-2">
                <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Gallery</span>
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center space-x-1 sm:space-x-2">
                <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Saved</span>
              </TabsTrigger>
              <TabsTrigger value="tagged" className="flex items-center space-x-1 sm:space-x-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Tagged</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-6">
              <SocialFeed filterUserId={profileUserId} currentUserId={currentUserId} />
            </TabsContent>

            <TabsContent value="gallery" className="mt-6">
              <UserGallery 
                userId={profile?.user_id} 
                isOwner={isOwnProfile}
              />
            </TabsContent>

            <TabsContent value="saved" className="mt-6">
              <div className="text-center py-12">
                <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No saved posts yet</h3>
                <p className="text-muted-foreground text-sm">
                  Save posts you love to see them here
                </p>
              </div>
            </TabsContent>

            <TabsContent value="tagged" className="mt-6">
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No tagged posts</h3>
                <p className="text-muted-foreground text-sm">
                  Posts where you're tagged will appear here
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
    </ResponsiveLayout>
  );
};

export default Profile;