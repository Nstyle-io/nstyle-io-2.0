import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Story {
  id: string;
  user_id: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  visibility: string;
  expires_at: string;
  created_at: string;
  profiles?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface StoryWithViewed extends Story {
  viewed: boolean;
}

const StoryBar = () => {
  const [stories, setStories] = useState<StoryWithViewed[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null);
  const navigate = useNavigate();

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const getFollowingIds = useCallback(async () => {
    if (!currentUser) return [];
    
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUser.id);
    
    return (data || []).map(f => f.following_id);
  }, [currentUser]);

  const fetchStories = useCallback(async () => {
    if (!currentUser) return;

    try {
      // First get following IDs
      const followingIds = await getFollowingIds();
      
      // Get all active stories with profile info
      const { data: storiesData, error } = await supabase
        .from('stories')
        .select(`
          id,
          user_id,
          content,
          image_url,
          video_url,
          visibility,
          expires_at,
          created_at,
          allowed_users
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!storiesData || storiesData.length === 0) {
        setStories([]);
        return;
      }

      // Get profile information for story authors
      const userIds = [...new Set(storiesData.map(story => story.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, is_private')
        .in('user_id', userIds);

      // Create a map of user profiles
      const profilesMap = new Map();
      (profilesData || []).forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      // Filter stories based on privacy settings and following status
      const visibleStories = storiesData.filter(story => {
        const profile = profilesMap.get(story.user_id);
        if (!profile) return false;

        // Own stories are always visible
        if (story.user_id === currentUser.id) return true;

        // Public stories from public accounts
        if (!profile.is_private && story.visibility === 'public') return true;

        // Stories from users we follow
        if (followingIds.includes(story.user_id)) {
          // Private accounts - only if we follow them
          if (profile.is_private) return true;
          // Public accounts - respect story visibility
          if (story.visibility === 'public' || story.visibility === 'followers') return true;
        }

        return false;
      });

      // Check which stories have been viewed by the current user
      const storiesWithViewStatus = await Promise.all(
        visibleStories.map(async (story) => {
          const { data: viewData } = await supabase
            .from('story_views')
            .select('id')
            .eq('story_id', story.id)
            .eq('viewer_id', currentUser.id)
            .maybeSingle();

          return {
            ...story,
            profiles: profilesMap.get(story.user_id),
            viewed: !!viewData
          };
        })
      );

      setStories(storiesWithViewStatus as StoryWithViewed[]);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, getFollowingIds]);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchStories();
    }
  }, [currentUser, fetchStories]);

  const handleStoryClick = async (story: StoryWithViewed) => {
    // Mark story as viewed if not already viewed and not own story
    if (!story.viewed && story.user_id !== currentUser?.id) {
      try {
        await supabase
          .from('story_views')
          .insert({
            story_id: story.id,
            viewer_id: currentUser.id
          });

        // Update local state
        setStories(prev => 
          prev.map(s => 
            s.id === story.id ? { ...s, viewed: true } : s
          )
        );
      } catch (error) {
        console.error('Error marking story as viewed:', error);
      }
    }
    // TODO: Open story viewer modal
  };

  if (loading) {
    return (
      <div className="flex space-x-4 p-4 overflow-x-auto custom-scrollbar">
        <div className="flex-shrink-0 flex flex-col items-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
          <div className="w-12 h-3 bg-muted animate-pulse rounded" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="w-12 h-3 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex space-x-4 p-4 overflow-x-auto custom-scrollbar">
      {/* Add Story */}
      <div className="flex-shrink-0 flex flex-col items-center space-y-2">
        <div 
          className="relative cursor-pointer" 
          onClick={() => navigate('/camera')}
        >
          <div className="w-16 h-16 rounded-full bg-gradient-dark border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary transition-colors">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
        <span className="text-xs text-muted-foreground font-medium">Your Story</span>
      </div>

      {/* Stories */}
      {stories.map((story) => (
        <div 
          key={story.id} 
          className="flex-shrink-0 flex flex-col items-center space-y-2 cursor-pointer"
          onClick={() => handleStoryClick(story)}
        >
          <div className="relative">
            <div className={`story-ring ${story.viewed ? 'opacity-50' : ''}`}>
              <Avatar className="story-avatar">
                <AvatarImage 
                  src={story.profiles?.avatar_url || ''} 
                  alt={story.profiles?.display_name || story.profiles?.username || 'User'} 
                />
                <AvatarFallback>
                  {(story.profiles?.display_name || story.profiles?.username || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            {!story.viewed && story.user_id !== currentUser?.id && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background" />
            )}
          </div>
          <span className="text-xs text-foreground font-medium truncate w-16 text-center">
            {story.profiles?.username || 'Unknown'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StoryBar;