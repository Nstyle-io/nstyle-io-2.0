import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Hash, Flame, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useCarousel } from '@/hooks/useCarousel';

interface TrendingItem {
  hashtag: string;
  post_count: number;
  trend_score: number;
  is_trending: boolean;
}

const TrendingSection = () => {
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fallback trending data
  const fallbackTrending: TrendingItem[] = useMemo(() => [
    { hashtag: "nailart", post_count: 12450, trend_score: 95.2, is_trending: true },
    { hashtag: "gelnails", post_count: 8920, trend_score: 87.5, is_trending: true },
    { hashtag: "manicure", post_count: 6780, trend_score: 82.1, is_trending: true },
    { hashtag: "naildesign", post_count: 5640, trend_score: 78.9, is_trending: false },
    { hashtag: "acrylicnails", post_count: 4320, trend_score: 75.3, is_trending: true },
    { hashtag: "nailtech", post_count: 3890, trend_score: 71.8, is_trending: false },
    { hashtag: "nailinspiration", post_count: 3456, trend_score: 69.2, is_trending: false },
    { hashtag: "frenchnails", post_count: 2890, trend_score: 65.7, is_trending: false },
    { hashtag: "nailsofinstagram", post_count: 2567, trend_score: 62.4, is_trending: true }
  ], []);

  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.rpc('get_trending_hashtags', { limit_count: 12 });
        
        if (error) throw error;
        
        // Use live data if available, otherwise fallback to sample data
        setTrendingItems((data && data.length > 0) ? data : fallbackTrending);
      } catch (error) {
        console.error('Error fetching trending data:', error);
        setTrendingItems(fallbackTrending);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingData();
  }, [fallbackTrending]);

  const { currentIndex, totalSlides, goToSlide } = useCarousel({
    totalItems: trendingItems.length,
    itemsPerSlide: 3,
    autoScrollInterval: 3500
  });

  const handleHashtagClick = (hashtag: string) => {
    navigate(`/hashtag/${hashtag}`);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto mb-16">
        <div className="flex items-center justify-center gap-2 mb-8">
          <TrendingUp className="w-6 h-6 text-primary animate-pulse" />
          <h3 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Loading Trends...
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted/20 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto mb-16">
      <div className="flex items-center justify-center gap-3 mb-8">
        <Flame className="w-6 h-6 text-orange-500" />
        <h3 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Trending Now
        </h3>
        <TrendingUp className="w-6 h-6 text-primary" />
      </div>

      <div className="relative overflow-hidden rounded-2xl">
        <div 
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {Array.from({ length: totalSlides }).map((_, slideIndex) => (
            <div key={slideIndex} className="w-full flex-shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                {trendingItems
                  .slice(slideIndex * 3, (slideIndex + 1) * 3)
                  .map((item, index) => (
                    <Button
                      key={`${slideIndex}-${index}`}
                      variant="outline"
                      className="h-auto p-6 bg-background/60 border-border/30 hover:bg-background/90 hover:border-primary/50 transition-all duration-300 group"
                      onClick={() => handleHashtagClick(item.hashtag)}
                    >
                      <div className="text-center w-full">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <Hash className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                          <span className="font-bold text-foreground text-lg">
                            {item.hashtag}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{item.post_count.toLocaleString()} posts</span>
                          </div>
                        </div>
                        
                        {item.is_trending && (
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-full">
                            <Flame className="w-3 h-3 text-orange-500" />
                            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                              Hot Trend
                            </span>
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Dots */}
        {totalSlides > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 hover:scale-125 ${
                  index === currentIndex 
                    ? 'bg-primary w-8' 
                    : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to trending slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingSection;