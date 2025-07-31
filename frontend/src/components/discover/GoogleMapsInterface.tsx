import { useEffect, useRef, useState } from 'react';

// Google Maps API type declarations
interface GoogleMapsAPI {
  maps: {
    Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMap;
    Marker: new (options: MarkerOptions) => GoogleMarker;
    Circle: new (options: CircleOptions) => GoogleCircle;
    InfoWindow: new (options: InfoWindowOptions) => GoogleInfoWindow;
    Size: new (width: number, height: number) => GoogleSize;
    Point: new (x: number, y: number) => GooglePoint;
    SymbolPath: {
      CIRCLE: number;
      BACKWARD_CLOSED_ARROW: number;
    };
    Animation: {
      DROP: number;
      BOUNCE: number;
    };
    LatLng: new (lat: number, lng: number) => GoogleLatLng;
    event: {
      addListener: (instance: unknown, eventName: string, handler: () => void) => void;
    };
    places: {
      PlacesService: new (map: GoogleMap) => GooglePlacesService;
      PlacesServiceStatus: {
        OK: string;
      };
    };
  };
}

interface GoogleMapOptions {
  center: { lat: number; lng: number };
  zoom: number;
  disableDefaultUI?: boolean;
  zoomControl?: boolean;
  mapTypeControl?: boolean;
  streetViewControl?: boolean;
  fullscreenControl?: boolean;
  styles?: unknown[];
}

interface GoogleMap {
  setCenter: (position: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
}

interface MarkerOptions {
  position: { lat: number; lng: number };
  map: GoogleMap;
  title?: string;
  icon?: {
    path: number;
    scale: number;
    fillColor: string;
    fillOpacity: number;
    strokeColor: string;
    strokeWeight: number;
  } | {
    url: string;
    scaledSize: GoogleSize;
    origin: GooglePoint;
    anchor: GooglePoint;
  };
  animation?: number;
  zIndex?: number;
}

interface GoogleMarker {
  setMap: (map: GoogleMap | null) => void;
  getTitle?: () => string;
  addListener: (event: string, handler: () => void) => void;
}

interface CircleOptions {
  center: { lat: number; lng: number };
  radius: number;
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  map: GoogleMap;
}

interface GoogleCircle {
  setMap: (map: GoogleMap | null) => void;
  setRadius: (radius: number) => void;
}

interface InfoWindowOptions {
  content: string;
}

interface GoogleInfoWindow {
  open: (map: GoogleMap, marker: GoogleMarker) => void;
}

interface GoogleSize {
  // Google Maps Size object
  width: number;
  height: number;
}

interface GooglePoint {
  // Google Maps Point object
  x: number;
  y: number;
}

interface GoogleLatLng {
  lat: () => number;
  lng: () => number;
}

interface GooglePlacesService {
  getDetails: (
    request: { placeId: string; fields: string[] },
    callback: (place: GooglePlace | null, status: string) => void
  ) => void;
}

interface GooglePlace {
  geometry?: {
    location: GoogleLatLng;
  };
  name?: string;
}

declare global {
  interface Window {
    google: GoogleMapsAPI;
  }
}

interface GoogleMapsInterfaceProps {
  apiKey: string;
  userLocation?: { lat: number; lng: number };
  onMapLoad: (map: GoogleMap) => void;
  searchRadius: number;
  highlightedPlaceId?: string;
  nearbyPlaces?: Array<{
    id: string;
    title: string;
    position: { lat: number; lng: number };
    type?: string;
  }>;
}

// Global flag to track if Google Maps script is already loaded
let isLoadingScript = false;

export const GoogleMapsInterface: React.FC<GoogleMapsInterfaceProps> = ({
  apiKey,
  userLocation,
  onMapLoad,
  searchRadius,
  highlightedPlaceId,
  nearbyPlaces = [],
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<GoogleMap | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [errorState, setErrorState] = useState<{
    type: 'script-error' | 'invalid-key' | 'timeout' | null;
    message?: string;
  }>({ type: null });
  const markersRef = useRef<GoogleMarker[]>([]);
  const circleRef = useRef<GoogleCircle | null>(null);

  useEffect(() => {
    console.log('GoogleMapsInterface: Checking if we should load map', { 
      hasApiKey: !!apiKey, 
      hasLocation: !!userLocation,
      isGoogleLoaded: !!window.google?.maps,
      apiKeyLength: apiKey?.length,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'none',
      userLocationValue: userLocation,
      mapRefExists: !!mapRef.current
    });
    
    const initializeMap = () => {
      if (!mapRef.current || !window.google?.maps) {
        console.log('GoogleMapsInterface: Cannot initialize - missing requirements');
        return;
      }

      console.log('GoogleMapsInterface: Initializing map...');
      
      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: userLocation || { lat: 40.7128, lng: -74.0060 },
          zoom: 13,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        mapInstanceRef.current = map;
        onMapLoad(map);
        setIsMapReady(true);
        console.log('GoogleMapsInterface: Map initialized successfully');

        // Add user location marker
        if (userLocation) {
          // Center map on user location
          map.setCenter(userLocation);
          map.setZoom(14);
          
          const userMarker = new window.google.maps.Marker({
            position: userLocation,
            map: map,
            title: 'Your Location',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
            zIndex: 1000
          });
          markersRef.current.push(userMarker);

          // Add search radius circle
          const circle = new window.google.maps.Circle({
            strokeColor: '#4285F4',
            strokeOpacity: 0.3,
            strokeWeight: 2,
            fillColor: '#4285F4',
            fillOpacity: 0.1,
            map: map,
            center: userLocation,
            radius: searchRadius * 1609.34 // Convert miles to meters
          });
          circleRef.current = circle;
        }
      } catch (error) {
        console.error('GoogleMapsInterface: Error initializing map:', error);
      }
    };

    const loadGoogleMapsScript = () => {
      // Check if already loaded
      if (window.google?.maps) {
        console.log('GoogleMapsInterface: Google Maps already loaded');
        initializeMap();
        return;
      }

      // Check if currently loading
      if (isLoadingScript) {
        console.log('GoogleMapsInterface: Script already loading, waiting...');
        const checkInterval = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(checkInterval);
            initializeMap();
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => clearInterval(checkInterval), 10000);
        return;
      }

      console.log('GoogleMapsInterface: Loading Google Maps script...');
      isLoadingScript = true;

      // Check if script tag already exists
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        console.log('GoogleMapsInterface: Script tag already exists, waiting for load...');
        const checkExisting = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(checkExisting);
            isLoadingScript = false;
            initializeMap();
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkExisting);
          isLoadingScript = false;
        }, 10000);
        return;
      }

      const script = document.createElement('script');
      const scriptSrc = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.src = scriptSrc;
      script.async = true;
      script.defer = true;
      
      console.log('GoogleMapsInterface: Creating script with src:', scriptSrc.replace(apiKey, `${apiKey.substring(0, 10)}...`));
      
      script.onload = () => {
        console.log('GoogleMapsInterface: Script loaded successfully');
        isLoadingScript = false;
        initializeMap();
      };
      
      script.onerror = (error) => {
        console.error('GoogleMapsInterface: Failed to load script:', error);
        console.error('Script src was:', script.src);
        isLoadingScript = false;
        
        // Show user-friendly error message
        setErrorState({
          type: 'script-error',
          message: `Error: ${error}`
        });
        setIsMapReady(false);
      };

      document.head.appendChild(script);
    };

    if (apiKey && mapRef.current) {
      // Validate API key format
      if (apiKey === 'your_google_maps_api_key_here' || apiKey.length < 20) {
        console.error('GoogleMapsInterface: Invalid API key format');
        setErrorState({
          type: 'invalid-key',
          message: 'Please configure a valid Google Maps API key'
        });
        return;
      }
      
      loadGoogleMapsScript();
      
      // Set a timeout fallback in case initialization hangs
      setTimeout(() => {
        if (!isMapReady && mapRef.current && !mapRef.current.querySelector('.timeout-message')) {
          console.warn('GoogleMapsInterface: Map initialization timeout');
          const timeoutDiv = document.createElement('div');
          timeoutDiv.className = 'timeout-message absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900';
          setErrorState({
            type: 'timeout',
            message: 'The map is taking longer than expected to load'
          });
          // Timeout div is now handled by React state
        }
      }, 15000); // 15 second timeout
    }

    // Cleanup function
    return () => {
      // Clear all markers
      markersRef.current.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];
      
      // Clear circle
      if (circleRef.current && circleRef.current.setMap) {
        circleRef.current.setMap(null);
      }
    };
  }, [apiKey, userLocation, onMapLoad, searchRadius, isMapReady]);

  // Update search radius
  useEffect(() => {
    if (circleRef.current && searchRadius) {
      circleRef.current.setRadius(searchRadius * 1609.34);
    }
  }, [searchRadius]);

  // Add markers for nearby places
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !window.google?.maps) return;

    console.log('GoogleMapsInterface: Updating markers for', nearbyPlaces.length, 'nearby places');

    // Clear existing place markers (but keep user location marker and circle)
    markersRef.current = markersRef.current.filter(marker => {
      const title = (marker as { getTitle?: () => string }).getTitle?.() || '';
      if (title !== 'Your Location' && title !== 'Highlighted Place') {
        marker.setMap(null);
        return false;
      }
      return true;
    });

    // Add new markers for nearby places
    nearbyPlaces.forEach(place => {
      if (place.position) {
        const marker = new window.google.maps.Marker({
          position: place.position,
          map: mapInstanceRef.current!,
          title: place.title,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new window.google.maps.Size(32, 32),
            origin: new window.google.maps.Point(0, 0),
            anchor: new window.google.maps.Point(16, 32)
          },
          animation: window.google.maps.Animation.DROP,
          zIndex: 100
        });

        // Add click listener to show info
        marker.addListener('click', () => {
          const infoDiv = document.createElement('div');
          infoDiv.className = 'p-3 min-w-[200px]';
          
          const titleEl = document.createElement('h3');
          titleEl.className = 'font-semibold text-gray-900 mb-1';
          titleEl.textContent = place.title;
          
          const typeEl = document.createElement('p');
          typeEl.className = 'text-sm text-gray-600';
          typeEl.textContent = place.type || 'Salon';
          
          infoDiv.appendChild(titleEl);
          infoDiv.appendChild(typeEl);
          
          const infoWindow = new window.google.maps.InfoWindow({
            content: infoDiv
          });
          infoWindow.open(mapInstanceRef.current!, marker);
        });

        markersRef.current.push(marker);
      }
    });

    console.log('GoogleMapsInterface: Added', nearbyPlaces.length, 'markers to map');
  }, [nearbyPlaces, isMapReady]);

  // Update highlighted place
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !highlightedPlaceId || !window.google?.maps) return;

    // Remove old highlighted markers first
    markersRef.current = markersRef.current.filter(marker => {
      const title = (marker as { getTitle?: () => string }).getTitle?.() || '';
      if (title === 'Highlighted Place') {
        marker.setMap(null);
        return false;
      }
      return true;
    });

    const placesService = new window.google.maps.places.PlacesService(mapInstanceRef.current);
    placesService.getDetails(
      {
        placeId: highlightedPlaceId,
        fields: ['geometry', 'name'],
      },
      (place: GooglePlace | null, status: string) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          // Add new highlighted marker with special styling
          const marker = new window.google.maps.Marker({
            position: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            map: mapInstanceRef.current!,
            title: 'Highlighted Place',
            animation: window.google.maps.Animation.BOUNCE,
            icon: {
              path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 8,
              fillColor: '#10B981', // Green color for highlighted
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
            zIndex: 1000
          });
          markersRef.current.push(marker);
          
          console.log('GoogleMapsInterface: Added highlighted marker for:', place.name);
        }
      }
    );
  }, [highlightedPlaceId, isMapReady]);

  return (
    <div className="relative h-full w-full bg-gray-100 dark:bg-gray-900">
      <div 
        ref={mapRef} 
        className="h-full w-full"
        style={{ 
          minHeight: '400px', 
          height: '100%',
          width: '100%',
          position: 'relative'
        }}
      />
      {!isMapReady && !errorState.type && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading map...</p>
            <p className="text-xs text-muted-foreground mt-2">
              {!window.google?.maps ? 'Loading Google Maps script...' : 'Initializing map...'}
            </p>
          </div>
        </div>
      )}
      
      {errorState.type && (
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900">
          <div className="text-center">
            {errorState.type === 'script-error' && (
              <>
                <div className="text-red-500 text-2xl mb-2">⚠️</div>
                <p className="text-sm font-semibold text-red-600 mb-2">Failed to load Google Maps</p>
                <p className="text-xs text-gray-600 mb-2">Please check your internet connection and API key</p>
                {errorState.message && (
                  <p className="text-xs text-gray-500 mt-2">{errorState.message}</p>
                )}
              </>
            )}
            {errorState.type === 'invalid-key' && (
              <>
                <div className="text-yellow-500 text-2xl mb-2">🔑</div>
                <p className="text-sm font-semibold text-yellow-600 mb-2">Invalid API Key</p>
                <p className="text-xs text-gray-600 mb-2">{errorState.message}</p>
              </>
            )}
            {errorState.type === 'timeout' && (
              <>
                <div className="text-orange-500 text-2xl mb-2">⏱️</div>
                <p className="text-sm font-semibold text-orange-600 mb-2">Map Loading Timeout</p>
                <p className="text-xs text-gray-600 mb-2">{errorState.message}</p>
                <button 
                  className="mt-2 px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};