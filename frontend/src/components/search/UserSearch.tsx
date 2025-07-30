import React, { useState, useEffect } from 'react';
import { Search, Users, UserPlus, UserCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  is_private: boolean;
  user_type: string;
  isFollowing?: boolean;
  followRequestPending?: boolean;
}

interface UserSearchProps {
  currentUserId?: string;
}

const UserSearch: React.FC<UserSearchProps> = ({ currentUserId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingState, setFollowingState] = useState<Record<string, {
    isFollowing: boolean;
    pending: boolean;
  }>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('user_id', currentUserId || '')
        .limit(20);

      if (error) throw error;

      // Check follow status for each user
      if (currentUserId && data) {
        const userIds = data.map(user => user.user_id);
        
        const [followsData, requestsData] = await Promise.all([
          supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUserId)
            .in('following_id', userIds),
          supabase
            .from('follow_requests')
            .select('requested_id')
            .eq('requester_id', currentUserId)
            .eq('status', 'pending')
            .in('requested_id', userIds)
        ]);

        const followingIds = new Set(followsData.data?.map(f => f.following_id) || []);
        const pendingIds = new Set(requestsData.data?.map(r => r.requested_id) || []);

        const newFollowingState: Record<string, { isFollowing: boolean; pending: boolean }> = {};
        userIds.forEach(userId => {
          newFollowingState[userId] = {
            isFollowing: followingIds.has(userId),
            pending: pendingIds.has(userId)
          };
        });
        
        setFollowingState(newFollowingState);
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Search Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string, isPrivate: boolean) => {
    if (!currentUserId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to follow users.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isPrivate) {
        // Send follow request for private accounts
        const { error } = await supabase
          .from('follow_requests')
          .insert({
            requester_id: currentUserId,
            requested_id: targetUserId,
            status: 'pending'
          });

        if (error) throw error;

        setFollowingState(prev => ({
          ...prev,
          [targetUserId]: { isFollowing: false, pending: true }
        }));

        toast({
          title: "Follow Request Sent",
          description: "Your follow request has been sent.",
        });
      } else {
        // Direct follow for public accounts
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId
          });

        if (error) throw error;

        setFollowingState(prev => ({
          ...prev,
          [targetUserId]: { isFollowing: true, pending: false }
        }));

        toast({
          title: "Following",
          description: "You are now following this user.",
        });
      }
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Follow Error",
        description: "Failed to follow user. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);

      if (error) throw error;

      setFollowingState(prev => ({
        ...prev,
        [targetUserId]: { isFollowing: false, pending: false }
      }));

      toast({
        title: "Unfollowed",
        description: "You are no longer following this user.",
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Unfollow Error",
        description: "Failed to unfollow user. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          placeholder="Search users by username or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 glass-card border-white/10 bg-background/20"
        />
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-pulse w-8 h-8 bg-primary rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Searching users...</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users ({searchResults.length})
          </h3>
          
          {searchResults.map((user) => {
            const followState = followingState[user.user_id] || { isFollowing: false, pending: false };
            
            return (
              <div key={user.user_id} className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar 
                      className="w-12 h-12 cursor-pointer" 
                      onClick={() => window.location.href = `/profile?user=${user.user_id}`}
                    >
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {user.display_name?.[0] || user.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold truncate">
                          {user.display_name || user.username}
                        </h4>
                        {user.user_type === 'business' && (
                          <Badge variant="secondary" className="text-xs">Business</Badge>
                        )}
                        {user.is_private && (
                          <Badge variant="outline" className="text-xs">Private</Badge>
                        )}
                      </div>
                      {user.username && user.display_name && (
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      )}
                      {user.bio && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{user.bio}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {followState.pending ? (
                      <Button variant="outline" size="sm" disabled>
                        Pending
                      </Button>
                    ) : followState.isFollowing ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUnfollow(user.user_id)}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Following
                      </Button>
                    ) : (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleFollow(user.user_id, user.is_private)}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Follow
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {searchQuery.length >= 2 && searchResults.length === 0 && !loading && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground text-sm">
            Try searching with a different username or name
          </p>
        </div>
      )}
    </div>
  );
};

export default UserSearch;