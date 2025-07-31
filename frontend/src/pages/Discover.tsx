import { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Compass, Users, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import UserSearch from '@/components/search/UserSearch';
import { GoogleMapsInterface } from '@/components/discover/GoogleMapsInterface';
import { LiveSearchBar } from '@/components/discover/LiveSearchBar';
import { supabase } from '@/integrations/supabase/client';

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
        LatLngBounds: new () => any;
        Animation: {
          DROP: number;
        };
      };
    };
  }
}

const quickCategories = [
  { id: 'nail-salons', label: 'Nail Salons', icon: MapPin, color: 'bg-primary/20 text-primary' },
  { id: 'nail-art', label: 'Nail Art', icon: Star, color: 'bg-secondary/20 text-secondary' },
  { id: 'manicure', label: 'Manicure', icon: Clock, color: 'bg-accent/20 text-accent' },
  { id: 'users', label: 'Users', icon: Users, color: 'bg-muted/20 text-muted-foreground' },
];

interface SearchResult {
  id: string;
  type: 'salon' | 'user' | 'hashtag' | 'place';
  title: string;
  subtitle?: string;
  avatar?: string;
  location?: string;
  rating?: number;
  verified?: boolean;
  distance?: string;
  placeId?: string;
  position?: { lat: number; lng: number };
}

const Discover = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('nail-salons');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<SearchResult[]>([]);
  const [searchRadius, setSearchRadius] = useState<number>(3); // Default 3 miles
  const [selectedPlace, setSelectedPlace] = useState<SearchResult | null>(null);
  const [mapRef, setMapRef] = useState<any>(null);

  useEffect(() => {
    getCurrentUser();
    fetchGoogleMapsKey();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'nail-salons' && userLocation) {
      performNearbySearch();
    }
  }, [selectedCategory, userLocation, searchRadius, performNearbySearch]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocationLoading(false);
        },
        (error) => {
          console.error('Geolocation failed:', error);
          // Default to New York if geolocation fails
          setUserLocation({ lat: 40.7128, lng: -74.0060 });
          setIsLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      // Geolocation not supported
      setUserLocation({ lat: 40.7128, lng: -74.0060 });
      setIsLocationLoading(false);
    }
  };

  const fetchGoogleMapsKey = async () => {
    try {
      console.log('Fetching Google Maps API key...');
      
      // First, check if we have an environment variable
      const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
      console.log('Environment key check:', { 
        hasEnvKey: !!envKey, 
        keyLength: envKey?.length,
        keyPreview: envKey ? `${envKey.substring(0, 10)}...` : 'none'
      });
      
      if (envKey && envKey !== 'your_google_maps_api_key_here') {
        console.log('Using Google Maps API key from environment variable');
        setGoogleMapsApiKey(envKey);
        return;
      }
      
      // If no env key, try Supabase function
      console.log('Attempting to fetch API key from Supabase function...');
      console.log('Supabase client URL:', supabase.supabaseUrl);
      
      const { data, error } = await supabase.functions.invoke('get-maps-api-key');
      
      console.log('Supabase function response:', { 
        data, 
        error,
        hasApiKey: !!data?.apiKey,
        apiKeyLength: data?.apiKey?.length,
        apiKeyPreview: data?.apiKey ? `${data.apiKey.substring(0, 8)}...` : 'none'
      });
      
      if (error) {
        console.error('Error fetching Google Maps API key:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // For development, you can hardcode a key here temporarily
        // setGoogleMapsApiKey('YOUR-API-KEY-HERE');
        
        // Show a user-friendly message
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50';
        toast.innerHTML = `
          <div>
            <p class="font-semibold">Google Maps API Error</p>
            <p class="text-sm mt-1">Please configure your API key in Supabase or environment variables.</p>
          </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 8000);
        return;
      }
      
      if (data?.apiKey) {
        console.log('Google Maps API key loaded successfully');
        console.log('API key length:', data.apiKey.length);
        setGoogleMapsApiKey(data.apiKey);
      } else {
        console.error('No API key found in response');
        console.error('Response data:', JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('Error fetching Google Maps API key:', error);
      console.error('Catch error details:', JSON.stringify(error, null, 2));
      
      // Show error notification
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50';
      toast.textContent = 'Failed to load Google Maps configuration.';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 5000);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleLocationRequest = () => {
    setIsLocationLoading(true);
    getUserLocation();
  };

  const performNearbySearch = useCallback(async () => {
    if (!userLocation) return;

    const results: SearchResult[] = [];

    try {
      // Search salons in database - get more salons to ensure we have enough within the radius
      const limit = Math.min(100, Math.max(50, searchRadius * 10)); // Dynamic limit based on radius
      const { data: salons } = await supabase
        .from('salon_profiles')
        .select('id, salon_name, address, city, state, latitude, longitude')
        .eq('is_verified', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(limit);

      if (salons) {
        const salonResults = salons
          .filter(salon => salon.latitude && salon.longitude)
          .map(salon => {
            const distance = calculateDistance(userLocation, {
              lat: salon.latitude!,
              lng: salon.longitude!
            });
            return {
              id: salon.id,
              type: 'salon' as const,
              title: salon.salon_name || 'Unnamed Salon',
              subtitle: salon.address || '',
              location: `${salon.city}, ${salon.state}`,
              verified: true,
              distance: `${distance.toFixed(1)} mi`,
              position: { lat: salon.latitude!, lng: salon.longitude! }
            };
          })
          .filter(salon => parseFloat(salon.distance) <= searchRadius)
          .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        results.push(...salonResults);
      }

      setSearchResults(results);
      
      // Try to search Google Places if available
      if (googleMapsApiKey && typeof window !== 'undefined' && window.google?.maps?.places) {
        try {
          const service = new window.google.maps.places.PlacesService(document.createElement('div'));
          const request = {
            location: new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
            radius: searchRadius * 1609.34, // Convert miles to meters
            type: 'beauty_salon' as any,
            keyword: 'nail salon'
          };
          
          console.log('Google Places search with radius:', searchRadius, 'miles =', searchRadius * 1609.34, 'meters');

          service.nearbySearch(request, (places: any, status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && places) {
              const placesResults = places.map((place: any) => ({
                id: place.place_id || '',
                placeId: place.place_id,
                type: 'place' as const,
                title: place.name || 'Unknown Place',
                subtitle: place.vicinity || '',
                location: place.vicinity || '',
                rating: place.rating,
                distance: `${calculateDistance(userLocation, {
                  lat: place.geometry?.location?.lat() || 0,
                  lng: place.geometry?.location?.lng() || 0
                }).toFixed(1)} mi`,
                position: {
                  lat: place.geometry?.location?.lat() || 0,
                  lng: place.geometry?.location?.lng() || 0
                }
              }));
              
              setNearbyPlaces(placesResults);
            }
          });
        } catch (error) {
          console.error('Google Places search error:', error);
        }
      }
    } catch (error) {
      console.error('Nearby search error:', error);
    }
  }, [userLocation, searchRadius, googleMapsApiKey]);

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

  const handlePlaceSelect = (place: SearchResult) => {
    setSelectedPlace(place);
    if (mapRef && place.position && userLocation) {
      // Calculate bounds to show both user location and selected place
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(new window.google.maps.LatLng(userLocation.lat, userLocation.lng));
      bounds.extend(new window.google.maps.LatLng(place.position.lat, place.position.lng));
      
      // Fit map to show both locations with some padding
      mapRef.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      });
      
      console.log('Map centered to show both user location and selected place:', place.title);
    } else if (mapRef && place.position) {
      // Fallback: just center on the selected place
      mapRef.setCenter(place.position);
      mapRef.setZoom(16);
    }
  };

  const allSalons = [...searchResults, ...nearbyPlaces]
    .filter(salon => {
      // Filter by search radius
      if (salon.distance) {
        const distance = parseFloat(salon.distance);
        const withinRadius = distance <= searchRadius;
        if (!withinRadius) {
          console.log(`Filtering out ${salon.title}: ${distance} mi > ${searchRadius} mi`);
        }
        return withinRadius;
      }
      return true;
    })
    .sort((a, b) => {
      const distA = a.distance ? parseFloat(a.distance) : 999;
      const distB = b.distance ? parseFloat(b.distance) : 999;
      return distA - distB;
    });

  console.log(`Search results: ${searchResults.length}, Nearby places: ${nearbyPlaces.length}, Filtered salons: ${allSalons.length}, Search radius: ${searchRadius} miles`);

  if (!googleMapsApiKey) {
    return (
      <ResponsiveLayout>
        <div className="flex flex-col h-screen bg-background">
          {/* Header */}
          <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-b border-white/10 p-4">
            <div className="flex items-center space-x-3">
              <Compass className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Discover</h1>
            </div>
          </div>

          {/* API Key Required Message */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center glass-card p-8 rounded-xl max-w-md w-full">
              <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Google Maps Required</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Google Maps API key is required to discover nearby salons and locations.
              </p>
              <p className="text-xs text-muted-foreground">
                Please configure the API key in your environment settings.
              </p>
            </div>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-b border-white/10 p-3 space-y-3">
          {/* Title and Location */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Compass className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Discover</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLocationRequest}
              disabled={isLocationLoading}
              className="flex items-center space-x-2"
            >
              <Navigation className={`w-4 h-4 ${isLocationLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm">
                {isLocationLoading ? 'Getting location...' : 'Use my location'}
              </span>
            </Button>
          </div>

          {/* Quick Categories */}
          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
            {quickCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={`cursor-pointer whitespace-nowrap px-3 py-2 text-xs transition-all flex-shrink-0 flex items-center space-x-1 ${
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-primary/20'
                  }`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <IconComponent className="w-3 h-3" />
                  <span>{category.label}</span>
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {selectedCategory === 'users' ? (
            <div className="h-full overflow-y-auto">
              <UserSearch currentUserId={currentUser?.id} />
            </div>
          ) : (
            /* 2-Column Grid Layout */
            <div className="h-full grid grid-cols-1 lg:grid-cols-2">
              {/* Left Column - Map */}
              <div className="h-full border-r border-white/10 relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                {/* Map Container with consistent background */}
                <div className="h-full w-full relative">
                  {googleMapsApiKey && userLocation ? (
                    <GoogleMapsInterface
                      apiKey={googleMapsApiKey}
                      userLocation={userLocation}
                      onMapLoad={(map) => {
                        console.log('Map loaded successfully');
                        setMapRef(map);
                      }}
                      searchRadius={searchRadius}
                      highlightedPlaceId={selectedPlace?.placeId}
                      nearbyPlaces={allSalons}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                      <div className="text-center">
                        <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
                        <p className="text-muted-foreground text-lg font-medium">
                          {!googleMapsApiKey ? 'Loading Google Maps...' : 'Getting your location...'}
                        </p>
                        <p className="text-muted-foreground text-sm mt-2">
                          {!googleMapsApiKey ? 'Fetching API key' : 'Please allow location access'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Salon List */}
              <div className="h-full flex flex-col bg-background overflow-hidden">
                {/* Search Bar */}
                <div className="flex-shrink-0 p-4 border-b border-white/10">
                  <LiveSearchBar
                    placeholder="Search nail salons, users, or places..."
                    className="w-full"
                    googleMapsApiKey={googleMapsApiKey}
                    userLocation={userLocation}
                    onResultSelect={(result) => {
                      console.log('Search result selected:', result);
                      if ((result.type === 'salon' || result.type === 'place') && result.position) {
                        // Create a SearchResult with the correct format
                        const placeResult: SearchResult = {
                          id: result.id,
                          type: result.type,
                          title: result.title,
                          subtitle: result.subtitle,
                          location: result.location,
                          rating: result.rating,
                          verified: result.verified,
                          distance: result.distance,
                          position: result.position,
                          placeId: result.placeId
                        };
                        handlePlaceSelect(placeResult);
                      }
                    }}
                  />
                </div>

                {/* Range Control */}
                <div className="flex-shrink-0 p-4 border-b border-white/10">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Search Radius</label>
                      <span className="text-sm text-muted-foreground">{searchRadius} miles</span>
                    </div>
                    <Slider
                      value={[searchRadius]}
                      onValueChange={(value) => setSearchRadius(value[0])}
                      min={1}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* List Header */}
                <div className="flex-shrink-0 p-4 border-b border-white/10">
                  <h3 className="font-semibold text-lg">Nearby Nail Salons</h3>
                  <p className="text-sm text-muted-foreground">
                    {allSalons.length} salons within {searchRadius} miles
                  </p>
                </div>

                {/* Salons List - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {allSalons.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No salons found in your area.</p>
                      <p className="text-sm mt-2">Try increasing the search radius.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allSalons.map((salon) => (
                      <Card 
                        key={salon.id} 
                        className={`glass-card cursor-pointer transition-all hover:bg-primary/10 ${
                          selectedPlace?.id === salon.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handlePlaceSelect(salon)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm flex items-center">
                                {salon.title}
                                {salon.verified && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    Verified
                                  </Badge>
                                )}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {salon.subtitle || salon.location}
                              </p>
                              <div className="flex items-center mt-2 space-x-3 text-xs">
                                {salon.distance && (
                                  <span className="flex items-center text-primary">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {salon.distance}
                                  </span>
                                )}
                                {salon.rating && (
                                  <span className="flex items-center">
                                    <Star className="w-3 h-3 mr-1 text-yellow-500" />
                                    {salon.rating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Discover;