/// <reference types="google.maps" />
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Star, MapPin, ExternalLink, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';


interface SalonPlace extends google.maps.places.PlaceResult {
  userRating?: number;
  userReview?: string;
  isFavorite?: boolean;
  distance?: number;
}

interface SalonSearchListProps {
  apiKey: string;
  searchQuery: string;
  userLocation?: { lat: number; lng: number };
}

const SalonSearchList: React.FC<SalonSearchListProps> = ({ 
  apiKey, 
  searchQuery, 
  userLocation 
}) => {
  const [salons, setSalons] = useState<SalonPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState<SalonPlace | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState('');
  const { toast } = useToast();

  const searchSalons = useCallback(async (query: string) => {
    if (!apiKey || !query) {
      toast({
        title: "Search Error",
        description: "Please enter a search query and ensure API key is configured.",
        variant: "destructive"
      });
      return;
    }

    if (apiKey === 'your-google-maps-api-key') {
      toast({
        title: "API Key Required",
        description: "Please configure your Google Maps API key to search for salons.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Initialize Google Maps and Places Service if not already done
      if (!window.google || !window.google.maps) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Create a temporary map and places service for searching
      const mapDiv = document.createElement('div');
      const map = new google.maps.Map(mapDiv, {
        center: userLocation || { lat: 40.7128, lng: -74.0060 },
        zoom: 15
      });
      
      const service = new google.maps.places.PlacesService(map);
      const searchLocation = userLocation || { lat: 40.7128, lng: -74.0060 };
      
      console.log('Searching with query:', query);
      
      // Use Places Service textSearch
      const request: google.maps.places.TextSearchRequest = {
        query: `${query} nail salon`,
        location: new google.maps.LatLng(searchLocation.lat, searchLocation.lng),
        radius: 15000,
        type: 'beauty_salon'
      };

      service.textSearch(request, (results, status) => {
        console.log('Search response:', { results, status });
        
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // Filter for nail-related businesses and add distance calculation
          const salonResults = results
            .filter((place) => 
              place.name?.toLowerCase().includes('nail') ||
              place.types?.includes('beauty_salon') ||
              place.name?.toLowerCase().includes('spa') ||
              place.name?.toLowerCase().includes('manicure') ||
              place.name?.toLowerCase().includes('pedicure') ||
              place.name?.toLowerCase().includes('beauty') ||
              place.business_status === 'OPERATIONAL'
            )
            .map((place) => ({
              ...place,
              distance: userLocation && place.geometry?.location ? calculateDistance(
                userLocation.lat,
                userLocation.lng,
                place.geometry.location.lat(),
                place.geometry.location.lng()
              ) : undefined
            }))
            .sort((a, b) => {
              // Sort by distance first, then by rating
              if (a.distance && b.distance) {
                return a.distance - b.distance;
              }
              return (b.rating || 0) - (a.rating || 0);
            })
            .slice(0, 20);

          setSalons(salonResults);
          
          if (salonResults.length === 0) {
            // Fallback search with broader terms
            searchWithFallback(query, service);
          } else {
            toast({
              title: "Search Complete",
              description: `Found ${salonResults.length} nail salons nearby.`,
            });
          }
        } else {
          console.error('Places search failed:', status);
          
          if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            toast({
              title: "API Access Denied",
              description: "Please check your Google Maps API key configuration. Ensure Places API is enabled.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Search Failed",
              description: "Unable to search for salons. Please try again.",
              variant: "destructive"
            });
          }
          setSalons([]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Error searching salons:', error);
      toast({
        title: "Network Error",
        description: "Unable to initialize search service. Please check your API key.",
        variant: "destructive"
      });
      setSalons([]);
      setLoading(false);
    }
  }, [apiKey, userLocation, toast, searchWithFallback]);

  // Fallback search with simpler terms
  const searchWithFallback = useCallback(async (originalQuery: string, service: google.maps.places.PlacesService) => {
    try {
      const searchLocation = userLocation || { lat: 40.7128, lng: -74.0060 };
      
      const fallbackRequest: google.maps.places.TextSearchRequest = {
        query: 'nail salon',
        location: new google.maps.LatLng(searchLocation.lat, searchLocation.lng),
        radius: 20000
      };
      
      service.textSearch(fallbackRequest, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const salonResults = results.slice(0, 15);
          setSalons(salonResults);
          
          toast({
            title: "Broader Search",
            description: `Found ${salonResults.length} beauty salons in a wider area.`,
          });
        }
      });
    } catch (error) {
      console.error('Fallback search failed:', error);
    }
  }, [setSalons, toast, userLocation]);

  // Distance calculation function
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    if (searchQuery) {
      searchSalons(searchQuery);
    }
  }, [searchQuery, searchSalons]);

  const handleRateSalon = (salon: SalonPlace) => {
    setSelectedSalon(salon);
    setNewRating(salon.userRating || 0);
    setNewReview(salon.userReview || '');
    setShowReviewDialog(true);
  };

  const submitRating = () => {
    if (!selectedSalon) return;

    // Update the salon in our local state
    setSalons(prev => prev.map(salon => 
      salon.place_id === selectedSalon.place_id 
        ? { ...salon, userRating: newRating, userReview: newReview }
        : salon
    ));

    toast({
      title: "Rating Submitted",
      description: "Your rating has been saved successfully!",
    });

    setShowReviewDialog(false);
    setSelectedSalon(null);
    setNewRating(0);
    setNewReview('');
  };

  const toggleFavorite = (salonId: string) => {
    setSalons(prev => prev.map(salon => 
      salon.place_id === salonId 
        ? { ...salon, isFavorite: !salon.isFavorite }
        : salon
    ));
  };


  const renderStars = (rating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => interactive && onStarClick?.(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!searchQuery) {
    return (
      <div className="text-center py-12 glass-card rounded-xl">
        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold mb-2">Search for Nail Salons</h3>
        <p className="text-muted-foreground text-sm">
          Enter a location or salon name to find nearby nail salons
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 md:p-4 space-y-3 md:space-y-4 pb-20">
        {/* Search Results Header */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base md:text-lg font-semibold">
            {salons.length} {salons.length === 1 ? 'salon' : 'salons'}
          </h2>
          <div className="text-xs md:text-sm text-muted-foreground">
            Near you
          </div>
        </div>

        {salons.map((salon) => (
        <Card key={salon.place_id} className="bg-background/95 backdrop-blur-sm border border-white/10 hover:bg-background transition-colors">
          <CardContent className="p-3 md:p-4">
            {/* Header with photo and basic info */}
            <div className="flex gap-3 mb-3">
              {/* Salon Photo */}
              <div className="flex-shrink-0">
                {salon.photos && salon.photos[0] ? (
                  <img 
                    src={salon.photos[0].getUrl({ maxWidth: 80, maxHeight: 80 })}
                    alt={salon.name}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-muted flex items-center justify-center">
                    <MapPin className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm md:text-base truncate">{salon.name}</h3>
                    
                    {/* Rating and status */}
                    <div className="flex items-center gap-2 mt-1">
                      {salon.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs md:text-sm font-medium">{salon.rating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({salon.user_ratings_total})
                          </span>
                        </div>
                      )}
                      
                      {salon.opening_hours && (
                        <Badge 
                          variant={salon.opening_hours.open_now ? "default" : "secondary"}
                          className={`text-xs h-5 ${salon.opening_hours.open_now ? 'bg-green-500 text-white' : 'bg-muted'}`}
                        >
                          {salon.opening_hours.open_now ? 'Open' : 'Closed'}
                        </Badge>
                      )}
                    </div>

                    {/* Price Level */}
                    {salon.price_level && (
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 4 }, (_, i) => (
                          <span 
                            key={i} 
                            className={`text-xs ${i < salon.price_level ? 'text-green-500' : 'text-gray-300'}`}
                          >
                            $
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Distance and Favorite */}
                  <div className="flex flex-col items-end gap-1 ml-2">
                    {salon.distance && (
                      <span className="text-xs text-muted-foreground font-medium">
                        {salon.distance.toFixed(1)} km
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(salon.place_id!)}
                      className="h-6 w-6 p-0"
                    >
                      <Heart 
                        className={`w-4 h-4 ${
                          salon.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'
                        }`} 
                      />
                    </Button>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-1 mt-2">
                  <MapPin className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                    {salon.formatted_address || salon.vicinity}
                  </span>
                </div>
              </div>
            </div>

            {/* User Review (if exists) */}
            {salon.userReview && (
              <div className="bg-muted/50 rounded-lg p-2 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium">Your Review</span>
                  {salon.userRating && renderStars(salon.userRating)}
                </div>
                <p className="text-xs text-muted-foreground">{salon.userReview}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRateSalon(salon)}
                className="text-xs h-8"
              >
                <Star className="w-3 h-3 mr-1" />
                Rate
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs h-8"
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${salon.geometry?.location?.lat()},${salon.geometry?.location?.lng()}`, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Directions
              </Button>
              
              <Button 
                className="btn-gradient text-xs h-8 col-span-2 md:col-span-1"
                disabled
              >
                Book Now
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate & Review {selectedSalon?.name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Rating</label>
                {renderStars(newRating, true, setNewRating)}
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Your Review</label>
                <Textarea
                  placeholder="Share your experience..."
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={submitRating}
                  disabled={newRating === 0}
                  className="btn-gradient"
                >
                  Submit Rating
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SalonSearchList;