import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, UserPlus, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedFollowButton } from '@/components/social/EnhancedFollowButton';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';

const FollowList = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'followers';
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const [userData, setUserData] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      // Fetch user profile
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (profile) {
          setUserData({
            id: profile.user_id,
            name: profile.display_name || 'Unknown User',
            username: profile.username || 'unknown',
            avatar: profile.avatar_url
          });
        }
      }

      // Fetch followers and following
      await Promise.all([
        fetchFollowers(),
        fetchFollowing()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId);

    if (!data) return;

    const followerIds = data.map(f => f.follower_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url, bio')
      .in('user_id', followerIds);

    const followersList = profiles?.map(profile => ({
      id: profile.user_id,
      name: profile.display_name || 'Unknown User',
      username: profile.username || 'unknown',
      avatar: profile.avatar_url,
      bio: profile.bio || '',
      isFollowing: false,
      isFollowingBack: false
    })) || [];

    setFollowers(followersList);
  };

  const fetchFollowing = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (!data) return;

    const followingIds = data.map(f => f.following_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url, bio')
      .in('user_id', followingIds);

    const followingList = profiles?.map(profile => ({
      id: profile.user_id,
      name: profile.display_name || 'Unknown User',
      username: profile.username || 'unknown',
      avatar: profile.avatar_url,
      bio: profile.bio || '',
      isFollowing: true,
      isFollowingBack: false
    })) || [];

    setFollowing(followingList);
  };

  const handleFollowToggle = (userId: number, currentlyFollowing: boolean) => {
    // Handle follow/unfollow logic
    console.log(`${currentlyFollowing ? 'Unfollow' : 'Follow'} user ${userId}`);
  };

  const filteredFollowers = followers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFollowing = following.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const UserCard = ({ user, showFollowButton = true }: { user: any; showFollowButton?: boolean }) => (
    <div className="glass-card p-4 rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>
              {user.name.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold truncate">{user.name}</h3>
              {user.isBusiness && (
                <Badge variant="secondary" className="text-xs">
                  Business
                </Badge>
              )}
              {user.isFollowingBack && (
                <Badge variant="outline" className="text-xs">
                  Follows you
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            {user.bio && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{user.bio}</p>
            )}
          </div>
        </div>

        {showFollowButton && (
          <EnhancedFollowButton
            targetUserId={user.id}
            currentUserId={currentUserId}
            size="sm"
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <main className="pt-16 pb-20 md:pb-4">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{userData?.name || 'User'}</h1>
              <p className="text-sm text-muted-foreground">@{userData?.username || 'unknown'}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
              className="pl-10 glass-card"
            />
          </div>

          <Tabs defaultValue={initialTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass-card">
              <TabsTrigger value="followers">
                Followers ({followers.length})
              </TabsTrigger>
              <TabsTrigger value="following">
                Following ({following.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="followers" className="mt-6">
              <div className="space-y-3">
                {filteredFollowers.length > 0 ? (
                  filteredFollowers.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchQuery ? 'No followers found' : 'No followers yet'}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? 'Try adjusting your search terms'
                        : 'Start sharing amazing nail content to gain followers!'
                      }
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="following" className="mt-6">
              <div className="space-y-3">
                {filteredFollowing.length > 0 ? (
                  filteredFollowing.map((user) => (
                    <UserCard key={user.id} user={user} showFollowButton={false} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchQuery ? 'No users found' : 'Not following anyone yet'}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? 'Try adjusting your search terms'
                        : 'Discover amazing nail artists and salons to follow!'
                      }
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default FollowList;