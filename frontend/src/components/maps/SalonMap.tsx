/// <reference types="google.maps" />
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    closed?: boolean;
  } | { closed: true };
}

interface Salon {
  id: string;
  salon_name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  business_hours: BusinessHours;
  description: string;
  logo_url: string;
  is_verified: boolean;
  lat?: number;
  lng?: number;
}

interface SalonMapProps {
  apiKey: string;
  onSalonSelect?: (salon: Salon) => void;
}

const SalonMap: React.FC<SalonMapProps> = ({ apiKey, onSalonSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [errorState, setErrorState] = useState<{
    type: 'auth-failed' | 'load-failed' | null;
    message?: string;
  }>({ type: null });

  useEffect(() => {
    fetchSalons();
  }, []);

  useEffect(() => {
    if (apiKey && mapRef.current && salons.length >= 0) {
      console.log('Initializing map with API key and salons:', { 
        hasApiKey: !!apiKey, 
        hasMapRef: !!mapRef.current, 
        salonsCount: salons.length 
      });
      initializeMap();
    }
  }, [apiKey, salons, initializeMap]);

  const fetchSalons = async () => {
    try {
      const { data, error } = await supabase
        .from('salon_profiles')
        .select('*')
        .eq('is_verified', true);

      if (error) throw error;
      
      // For demo purposes, add some sample coordinates
      const salonsWithCoords = (data || []).map((salon, _index) => ({
        ...salon,
        lat: 40.7128 + (Math.random() - 0.5) * 0.1, // Random coordinates around NYC
        lng: -74.0060 + (Math.random() - 0.5) * 0.1
      }));
      
      setSalons(salonsWithCoords);
    } catch (error) {
      console.error('Error fetching salons:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = useCallback(async () => {
    if (!mapRef.current || !apiKey) {
      console.log('Map initialization failed:', { hasMapRef: !!mapRef.current, hasApiKey: !!apiKey });
      return;
    }

    try {
      console.log('Loading Google Maps with API key:', apiKey.substring(0, 10) + '...');
      
      // Add global error handler for Google Maps
      (window as unknown as { gm_authFailure: () => void }).gm_authFailure = () => {
        console.error('Google Maps authentication failed - check your API key and billing');
        setErrorState({ type: 'auth-failed' });
      };
      
      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places', 'geometry']
      });

      console.log('Loading Google Maps API with Places library...');
      await loader.load();
      console.log('Google Maps loaded successfully');

      // Wait a bit for the API to be fully ready
      setTimeout(() => {
        getUserLocationAndCreateMap();
      }, 100);
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      
      // Show a detailed error state
      setErrorState({
        type: 'load-failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [apiKey, getUserLocationAndCreateMap]);

  const getUserLocationAndCreateMap = useCallback(() => {
    // Get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Geolocation success:', position.coords);
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        createMap(userLocation);
      },
      (error) => {
        console.log('Geolocation failed, using default location:', error);
        // Default to a central location if geolocation fails
        createMap({ lat: 40.7128, lng: -74.0060 }); // New York
      }
    );
  }, [createMap]);

  const createMap = useCallback((center: { lat: number; lng: number }) => {
    if (!mapRef.current) {
      console.log('Map container not found');
      return;
    }

    console.log('Creating Google Maps instance with center:', center);
    
    const map = new google.maps.Map(mapRef.current, {
      zoom: 12,
      center,
      mapTypeControl: true,
      fullscreenControl: true,
      streetViewControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry.fill',
          stylers: [{ color: '#1a1a2e' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#0f0f23' }]
        }
      ]
    });

    console.log('Google Maps instance created successfully');
    mapInstanceRef.current = map;

    // Add user location marker
    new google.maps.Marker({
      position: center,
      map,
      title: 'Your Location',
      icon: {
        url: 'data:image/svg+xml,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(24, 24),
        anchor: new google.maps.Point(12, 12)
      }
    });

    // Add salon markers
    salons.forEach(salon => {
      if (salon.lat && salon.lng) {
        const marker = new google.maps.Marker({
          position: { lat: salon.lat, lng: salon.lng },
          map,
          title: salon.salon_name,
          icon: {
            url: 'data:image/svg+xml,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#8b5cf6" stroke="#ffffff" stroke-width="2"/>
                <circle cx="12" cy="10" r="3" fill="#ffffff"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32)
          }
        });

        marker.addListener('click', () => {
          setSelectedSalon(salon);
          onSalonSelect?.(salon);
        });
      }
    });
  }, [salons, onSalonSelect]);

  const isOpenNow = (businessHours: BusinessHours) => {
    if (!businessHours) return false;
    
    const now = new Date();
    const day = now.getDay();
    const time = now.getHours() * 100 + now.getMinutes();
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayHours = businessHours[dayNames[day]];
    
    if (!todayHours || ('closed' in todayHours && todayHours.closed)) return false;
    
    // Type guard to ensure we have the correct type
    if ('closed' in todayHours && todayHours.closed) return false;
    
    const openTime = parseInt(todayHours.open.replace(':', ''));
    const closeTime = parseInt(todayHours.close.replace(':', ''));
    
    return time >= openTime && time <= closeTime;
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse w-8 h-8 bg-primary rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading salons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800" 
        style={{ minHeight: '100%', height: '100%' }}
      >
        {(!apiKey || apiKey === 'your-google-maps-api-key') && !errorState.type && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {!apiKey ? 'Loading map...' : 'Invalid API key'}
              </p>
            </div>
          </div>
        )}
        
        {errorState.type && (
          <div className="w-full h-full flex items-center justify-center p-4 bg-gray-200 dark:bg-gray-800">
            <div className="text-center">
              {errorState.type === 'auth-failed' && (
                <>
                  <div className="text-red-500 text-2xl mb-2">⚠️</div>
                  <p className="text-sm font-semibold text-red-600 mb-2">Google Maps Authentication Failed</p>
                  <p className="text-xs text-gray-600 mb-2">Please check:</p>
                  <ul className="text-xs text-gray-500 text-left space-y-1">
                    <li>• Maps JavaScript API is enabled</li>
                    <li>• Places API is enabled</li>
                    <li>• Billing is enabled in Google Cloud</li>
                    <li>• API key restrictions are correct</li>
                  </ul>
                </>
              )}
              {errorState.type === 'load-failed' && (
                <>
                  <div className="text-red-500 text-2xl mb-2">⚠️</div>
                  <p className="text-sm font-semibold text-red-600 mb-2">Failed to load Google Maps</p>
                  {errorState.message && (
                    <p className="text-xs text-gray-600 mb-2">Error: {errorState.message}</p>
                  )}
                  <p className="text-xs text-gray-500">Please enable Maps JavaScript API and Places API in Google Cloud Console</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Map/Satellite toggle buttons - positioned like Google Maps */}
      <div className="absolute top-4 left-4 z-10 flex bg-white rounded-lg shadow-lg overflow-hidden">
        <button className="px-4 py-2 text-sm font-medium bg-white text-gray-900 border-r border-gray-200">
          Map
        </button>
        <button className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">
          Satellite
        </button>
      </div>
      
      {selectedSalon && (
        <div className="absolute bottom-4 left-4 right-4 glass-card p-4 rounded-xl max-w-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {selectedSalon.salon_name}
                {selectedSalon.is_verified && (
                  <Badge variant="secondary" className="text-xs">Verified</Badge>
                )}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{selectedSalon.address}, {selectedSalon.city}</span>
              </div>
            </div>
            {isOpenNow(selectedSalon.business_hours) ? (
              <Badge className="bg-green-500 text-white">
                <Clock className="w-3 h-3 mr-1" />
                Open
              </Badge>
            ) : (
              <Badge variant="outline">Closed</Badge>
            )}
          </div>
          
          {selectedSalon.description && (
            <p className="text-sm text-muted-foreground mb-3">{selectedSalon.description}</p>
          )}
          
          <div className="flex gap-2">
            <Button className="flex-1 btn-gradient">
              Book Appointment
            </Button>
            {selectedSalon.phone && (
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalonMap;