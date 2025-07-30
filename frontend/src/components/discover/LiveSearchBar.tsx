import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Users, Hash, Clock, Star, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

// Declare window.google types
declare global {
  interface Window {
    google: {
      maps: {
        LatLng: new (lat: number, lng: number) => any;
        places: {
          PlacesService: new (element: HTMLElement) => any;
          PlacesServiceStatus: {
            OK: string;
          };
        };
      };
    };
  }
}

interface SearchResult {
  type: 'salon' | 'user' | 'hashtag' | 'recent' | 'place';
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string;
  location?: string;
  rating?: number;
  category?: string;
  verified?: boolean;
  position?: { lat: number; lng: number };
  placeId?: string;
  distance?: string;
}

interface LiveSearchBarProps {
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
  googleMapsApiKey?: string;
  userLocation?: { lat: number; lng: number };
}

export const LiveSearchBar: React.FC<LiveSearchBarProps> = ({
  onResultSelect,
  placeholder = "Search salons, users, or hashtags...",
  className = "",
  googleMapsApiKey,
  userLocation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Distance calculation function
  const calculateDistance = (pos1: { lat: number; lng: number }, pos2: { lat: number; lng: number }) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('nstyle_recent_searches');
    if (recent) {
      try {
        setRecentSearches(JSON.parse(recent).slice(0, 5));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Perform live search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    const results: SearchResult[] = [];

    try {
      // Search verified salons
      const { data: salons, error: salonsError } = await supabase
        .from('salon_profiles')
        .select('id, salon_name, address, city, state, description, latitude, longitude')
        .or(`salon_name.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_verified', true)
        .limit(3);

      if (salonsError) {
        console.warn('Error searching salons:', salonsError);
      }

      if (salons && salons.length > 0) {
        results.push(...salons.map(salon => {
          const distance = userLocation && salon.latitude && salon.longitude ? 
            calculateDistance(userLocation, { lat: salon.latitude, lng: salon.longitude }) : null;
          
          return {
            type: 'salon' as const,
            id: salon.id,
            title: salon.salon_name || 'Unnamed Salon',
            subtitle: salon.address ? `${salon.address}, ${salon.city}, ${salon.state}` : `${salon.city}, ${salon.state}`,
            location: salon.city && salon.state ? `${salon.city}, ${salon.state}` : 'Location not specified',
            verified: true,
            position: salon.latitude && salon.longitude ? { lat: salon.latitude, lng: salon.longitude } : undefined,
            distance: distance ? `${distance.toFixed(1)} mi` : undefined
          };
        }));
      }

      // Search users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, bio, location')
        .or(`display_name.ilike.%${query}%,username.ilike.%${query}%,bio.ilike.%${query}%`)
        .limit(3);

      if (usersError) {
        console.warn('Error searching users:', usersError);
      }

      if (users && users.length > 0) {
        results.push(...users.map(user => ({
          type: 'user' as const,
          id: user.user_id,
          title: user.display_name || user.username || 'Unknown User',
          subtitle: user.username ? `@${user.username}` : '',
          avatar: user.avatar_url,
          location: user.location
        })));
      }

      // Search trending hashtags
      try {
        const { data: trends, error: trendsError } = await supabase
          .rpc('get_trending_hashtags', { limit_count: 50 });

        if (!trendsError && trends && trends.length > 0) {
          let matchingTrends;
          
          if (query.startsWith('#')) {
            const hashtag = query.slice(1);
            if (hashtag.length > 0) {
              matchingTrends = trends.filter(trend => 
                trend.hashtag && trend.hashtag.toLowerCase().includes(hashtag.toLowerCase())
              ).slice(0, 3);
            }
          } else {
            matchingTrends = trends.filter(trend => 
              trend.hashtag && trend.hashtag.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 2);
          }
          
          if (matchingTrends && matchingTrends.length > 0) {
            results.push(...matchingTrends.map(trend => ({
              type: 'hashtag' as const,
              id: trend.hashtag,
              title: `#${trend.hashtag}`,
              subtitle: `${trend.post_count || 0} posts`,
              category: trend.is_trending ? 'trending' : 'hashtag'
            })));
          }
        } else if (trendsError) {
          console.warn('Error fetching trending hashtags:', trendsError);
        }
      } catch (hashtagError) {
        console.warn('Hashtag search failed:', hashtagError);
      }

      // Search Google Places
      if (googleMapsApiKey && userLocation && query.length > 2 && typeof window !== 'undefined' && window.google && window.google.maps) {
        try {
          const service = new window.google.maps.places.PlacesService(document.createElement('div'));
          const request = {
            location: new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
            radius: 10000, // 10km radius
            query: `${query} nail salon beauty`,
            type: 'beauty_salon' as string
          };

          service.textSearch(request, (places: unknown[], status: string) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && places) {
              const placesResults = places.slice(0, 3).map((place: any) => {
                const position = place.geometry?.location ? {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                } : undefined;
                
                const distance = position && userLocation ? 
                  calculateDistance(userLocation, position) : null;
                
                return {
                  type: 'place' as const,
                  id: place.place_id || Math.random().toString(),
                  placeId: place.place_id,
                  title: place.name || 'Unknown Place',
                  subtitle: place.formatted_address || place.vicinity || '',
                  location: place.vicinity || '',
                  rating: place.rating,
                  verified: false,
                  position,
                  distance: distance ? `${distance.toFixed(1)} mi` : undefined
                };
              });
              
              // Add places results to existing results
              setSearchResults(prevResults => [...prevResults, ...placesResults]);
            }
          });
        } catch (error) {
          console.warn('Google Places search failed:', error);
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [googleMapsApiKey, userLocation]);

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, performSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const resultsList = showResults ? searchResults : recentSearches;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < resultsList.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && resultsList[activeIndex]) {
        handleResultSelect(resultsList[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setActiveIndex(-1);
    }
  };

  // Save to recent searches
  const saveToRecent = (result: SearchResult) => {
    const recent = [result, ...recentSearches.filter(r => r.id !== result.id)].slice(0, 5);
    setRecentSearches(recent);
    localStorage.setItem('nstyle_recent_searches', JSON.stringify(recent));
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    saveToRecent(result);
    setSearchQuery('');
    setShowResults(false);
    setActiveIndex(-1);

    // If result has position data (salon/place), call onResultSelect to show on map
    if ((result.type === 'salon' || result.type === 'place') && result.position) {
      onResultSelect?.(result);
      return;
    }

    // Navigate based on result type for non-map results
    try {
      switch (result.type) {
        case 'salon':
          navigate(`/salon/${result.id}`);
          break;
        case 'user': {
          const username = result.subtitle?.replace('@', '') || result.id;
          navigate(`/profile/${username}`);
          break;
        }
        case 'hashtag':
          navigate(`/hashtag/${result.id}`);
          break;
        default:
          console.warn('Unknown result type:', result.type);
      }
      onResultSelect?.(result);
    } catch (navError) {
      console.error('Navigation error:', navError);
    }
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('nstyle_recent_searches');
  };

  const getResultIcon = (type: string, category?: string) => {
    switch (type) {
      case 'salon':
        return <MapPin className="w-4 h-4 text-primary" />;
      case 'user':
        return <Users className="w-4 h-4 text-secondary" />;
      case 'hashtag':
        return category === 'trending' ? 
          <Hash className="w-4 h-4 text-orange-500" /> : 
          <Hash className="w-4 h-4 text-accent" />;
      case 'recent':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Search className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const renderResult = (result: SearchResult, index: number, isRecent = false) => (
    <div
      key={`${result.type}-${result.id}`}
      className={`flex items-center space-x-3 p-3 cursor-pointer transition-colors ${
        activeIndex === index ? 'bg-primary/10' : 'hover:bg-muted/50'
      }`}
      onClick={() => handleResultSelect(result)}
    >
      <div className="flex-shrink-0">
        {result.avatar ? (
          <img 
            src={result.avatar} 
            alt={result.title}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center">
            {getResultIcon(result.type, result.category)}
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="font-medium text-sm truncate">{result.title}</p>
          {result.verified && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Verified
            </Badge>
          )}
          {result.category === 'trending' && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-orange-500/30 text-orange-500">
              Trending
            </Badge>
          )}
        </div>
        {result.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
        )}
        {(result.location || result.distance) && (
          <div className="flex items-center justify-between">
            {result.location && result.type !== 'salon' && (
              <p className="text-xs text-muted-foreground flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {result.location}
              </p>
            )}
            {result.distance && (
              <p className="text-xs text-primary font-medium">
                {result.distance}
              </p>
            )}
          </div>
        )}
      </div>

      {isRecent && (
        <div className="flex-shrink-0">
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={searchRef}
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 h-11 bg-muted/50 border-muted-foreground/20 rounded-full text-sm transition-smooth focus:bg-background focus:ring-2 focus:ring-primary/20"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && (searchQuery ? searchResults.length > 0 : recentSearches.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-hidden shadow-lg animate-fade-in">
          <CardContent ref={resultsRef} className="p-0">
            {searchQuery ? (
              // Live search results
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {searchResults.map((result, index) => renderResult(result, index))}
              </div>
            ) : (
              // Recent searches
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between p-3 border-b border-border/20">
                  <p className="text-sm font-medium text-muted-foreground">Recent Searches</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="text-xs h-6 px-2"
                  >
                    Clear
                  </Button>
                </div>
                {recentSearches.map((result, index) => renderResult(result, index, true))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};