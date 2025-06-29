import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, AlertTriangle } from 'lucide-react';
import { mapsService } from '../../services/mapsService';
import { Trip, Location } from '../../types';

interface MapViewProps {
  trip: Trip | null;
  locations: Location[];
  onLocationSelect?: (location: Location) => void;
  showSafetyAlerts?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({ 
  trip, 
  locations, 
  onLocationSelect,
  showSafetyAlerts = true 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (map && locations.length > 0) {
      updateMapMarkers();
    }
  }, [map, locations]);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      setIsLoading(true);
      
      // Default to New York if no trip destination
      const defaultCenter = { lat: 40.7128, lng: -74.0060 };
      let center = defaultCenter;

      if (trip?.destination) {
        // Try to geocode the destination, fallback to default
        try {
          center = await geocodeAddress(trip.destination);
        } catch {
          console.warn('Geocoding failed, using default location');
        }
      }

      const mapInstance = await mapsService.initializeMap(mapRef.current, center);
      setMap(mapInstance);
      setError(null);
    } catch (err) {
      setError('Maps not available in demo mode');
      console.warn('Map initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.maps) {
        reject(new Error('Google Maps not loaded'));
        return;
      }

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          reject(new Error('Geocoding failed'));
        }
      });
    });
  };

  const updateMapMarkers = () => {
    if (!map) return;

    // Clear existing markers
    mapsService.clearMarkers();

    // Add markers for each location
    locations.forEach((location, index) => {
      const marker = mapsService.addMarker(
        { lat: location.lat, lng: location.lng },
        location.name,
        getMarkerType(location)
      );

      if (marker && onLocationSelect) {
        marker.addListener('click', () => {
          onLocationSelect(location);
        });
      }
    });

    // Fit map to show all markers
    if (locations.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach(location => {
        bounds.extend({ lat: location.lat, lng: location.lng });
      });
      map.fitBounds(bounds);
    }
  };

  const getMarkerType = (location: Location): 'hotel' | 'restaurant' | 'attraction' | 'danger' => {
    // This would be determined by the location type or safety data
    if (location.name.toLowerCase().includes('hotel')) return 'hotel';
    if (location.name.toLowerCase().includes('restaurant')) return 'restaurant';
    return 'attraction';
  };

  const calculateRoute = async () => {
    if (locations.length < 2) return;

    try {
      const waypoints = locations.map(loc => ({ lat: loc.lat, lng: loc.lng }));
      await mapsService.calculateRoute(waypoints);
    } catch (error) {
      console.error('Route calculation failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Configure Google Maps API key to enable interactive maps
          </p>
          <button
            onClick={initializeMap}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-96 rounded-lg shadow-lg" />
      
      {locations.length > 1 && (
        <div className="absolute top-4 right-4 space-y-2">
          <button
            onClick={calculateRoute}
            className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Calculate route"
          >
            <Navigation className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      )}

      {showSafetyAlerts && (
        <div className="absolute bottom-4 left-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 max-w-sm">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Safety Alert
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Be cautious in crowded tourist areas. Keep valuables secure.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};