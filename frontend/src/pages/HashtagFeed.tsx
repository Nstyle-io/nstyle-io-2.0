import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Hash, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import { SocialFeed } from '@/components/social/SocialFeed';
import { supabase } from '@/integrations/supabase/client';

export default function HashtagFeed() {
  const { hashtag } = useParams<{ hashtag: string }>();
  const navigate = useNavigate();
  const [postCount, setPostCount] = useState(0);
  const [trendScore, setTrendScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    getCurrentUser();
    if (hashtag) {
      fetchHashtagStats();
    }
  }, [hashtag]);

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

  const fetchHashtagStats = async () => {
    try {
      // Get hashtag statistics
      const { data } = await supabase.rpc('get_trending_hashtags', { limit_count: 100 });
      
      if (data) {
        const hashtagData = data.find((h: any) => h.hashtag.toLowerCase() === hashtag?.toLowerCase());
        if (hashtagData) {
          setPostCount(hashtagData.post_count);
          setTrendScore(hashtagData.trend_score);
        }
      }
    } catch (error) {
      console.error('Error fetching hashtag stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <ResponsiveLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="hover:bg-muted/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <Hash className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">#{hashtag}</h1>
                {trendScore > 100 && (
                  <Badge variant="outline" className="border-orange-500/30 text-orange-500">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {!loading && (
            <div className="px-4 pb-4">
              <p className="text-sm text-muted-foreground">
                {postCount > 0 ? `${postCount.toLocaleString()} posts` : 'Be the first to post with this hashtag!'}
              </p>
            </div>
          )}
        </div>

        {/* Feed */}
        <div className="max-w-2xl mx-auto">
          <SocialFeed hashtag={hashtag} currentUserId={currentUserId} />
        </div>
      </div>
    </ResponsiveLayout>
  );
}