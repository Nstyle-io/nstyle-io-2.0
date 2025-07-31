import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Settings, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Story {
  id: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  visibility: string;
  expires_at: string;
  created_at: string;
  view_count?: number;
}

interface StoriesManagementProps {
  currentUserId: string;
}

export const StoriesManagement: React.FC<StoriesManagementProps> = ({
  currentUserId
}) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStories();
  }, [fetchUserStories]);

  const fetchUserStories = useCallback(async () => {
    try {
      // Fetch user's active stories
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', currentUserId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      // For each story, count views
      const storiesWithViews = await Promise.all(
        (storiesData || []).map(async (story) => {
          const { count } = await supabase
            .from('story_views')
            .select('*', { count: 'exact', head: true })
            .eq('story_id', story.id);

          return {
            ...story,
            view_count: count || 0
          };
        })
      );

      setStories(storiesWithViews);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const handleDeleteStory = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;

      setStories(prev => prev.filter(story => story.id !== storyId));
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    const variants = {
      public: 'default',
      followers: 'secondary',
      private: 'outline'
    } as const;

    return (
      <Badge variant={variants[visibility as keyof typeof variants] || 'default'}>
        {visibility}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stories.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
            <Eye className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No active stories</h3>
          <p className="text-muted-foreground">
            You don't have any active stories at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Your Stories
          <Badge variant="secondary">{stories.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          {stories.map((story) => (
            <div key={story.id} className="flex items-center space-x-4 p-4 glass-card rounded-xl">
              <div className="relative">
                {story.image_url ? (
                  <img
                    src={story.image_url}
                    alt="Story"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : story.video_url ? (
                  <video
                    src={story.video_url}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getVisibilityBadge(story.visibility)}
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(story.created_at))} ago
                  </span>
                </div>
                
                {story.content && (
                  <p className="text-sm line-clamp-2 mb-2">{story.content}</p>
                )}
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <Eye className="w-4 h-4 mr-1" />
                  {story.view_count} views
                  <span className="mx-2">•</span>
                  <span>
                    Expires {formatDistanceToNow(new Date(story.expires_at))} from now
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button size="sm" variant="ghost">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleDeleteStory(story.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};