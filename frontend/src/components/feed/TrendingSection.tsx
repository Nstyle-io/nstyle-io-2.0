import React, { useEffect, useState } from 'react';
import { TrendingUp, Hash, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface TrendingTopic {
  hashtag: string;
  post_count: number;
  trend_score: number;
  is_trending: boolean;
}

const TrendingSection = () => {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrendingHashtags();
  }, []);

  const fetchTrendingHashtags = async () => {
    try {
      const { data, error } = await supabase.rpc('get_trending_hashtags', { limit_count: 10 });
      
      if (error) {
        console.error('Error fetching trending hashtags:', error);
        setTrendingTopics([]);
      } else {
        setTrendingTopics(data || []);
      }
    } catch (error) {
      console.error('Error in fetchTrendingHashtags:', error);
      setTrendingTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagClick = (hashtag: string) => {
    navigate(`/hashtag/${hashtag}`);
  };

  if (loading) {
    return (
      <div className="glass-card p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="font-bold text-lg">Trending Now</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-muted/20 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 space-y-4 animate-fade-in">
      <div className="flex items-center space-x-2">
        <Flame className="w-5 h-5 text-orange-500 animate-pulse-glow" />
        <h2 className="font-bold text-lg">Trending Now</h2>
      </div>
      
      {trendingTopics.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-muted/20 rounded-full mx-auto mb-3 flex items-center justify-center">
            <Hash className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">No trending hashtags yet</p>
          <p className="text-muted-foreground text-xs mt-1">Create posts with hashtags to see trends!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trendingTopics.map((topic, index) => (
            <div 
              key={topic.hashtag} 
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/20 transition-smooth cursor-pointer card-interactive"
              onClick={() => handleHashtagClick(topic.hashtag)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-muted-foreground font-bold text-sm w-6 transition-smooth">
                  {index + 1}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm hover:text-primary transition-smooth">#{topic.hashtag}</span>
                    {topic.is_trending && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-orange-500/30 text-orange-500 animate-pulse">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Hot
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {topic.post_count.toLocaleString()} posts
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {Math.round(topic.trend_score)}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <Button 
        variant="ghost" 
        className="w-full text-primary hover:text-primary/80 transition-smooth hover:scale-105"
        onClick={() => navigate('/discover')}
      >
        Discover more trends
      </Button>
    </div>
  );
};

export default TrendingSection;