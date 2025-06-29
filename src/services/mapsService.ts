import { Loader } from '@googlemaps/js-api-loader';

export class MapsService {
  private loader: Loader | null = null;
  private map: google.maps.Map | null = null;
  private markers: google.maps.Marker[] = [];

  constructor() {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (apiKey && apiKey !== 'your_google_maps_api_key_here') {
      this.loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places', 'geometry', 'visualization']
      });
    }
  }

  async initializeMap(container: HTMLElement, center: { lat: number; lng: number }) {
    try {
      if (!this.loader) {
        throw new Error('Google Maps API key not configured');
      }

      await this.loader.load();
      
      this.map = new google.maps.Map(container, {
        center,
        zoom: 12,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      return this.map;
    } catch (error) {
      console.error('Maps initialization error:', error);
      throw new Error('Failed to initialize Google Maps');
    }
  }

  async searchPlaces(query: string, location: { lat: number; lng: number }) {
    try {
      if (!this.loader) {
        throw new Error('Google Maps API key not configured');
      }

      await this.loader.load();
      
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      return new Promise((resolve, reject) => {
        service.textSearch({
          query,
          location: new google.maps.LatLng(location.lat, location.lng),
          radius: 50000
        }, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else {
            reject(new Error('Places search failed'));
          }
        });
      });
    } catch (error) {
      console.error('Places search error:', error);
      throw new Error('Failed to search places');
    }
  }

  async getPlaceDetails(placeId: string) {
    try {
      if (!this.loader) {
        throw new Error('Google Maps API key not configured');
      }

      await this.loader.load();
      
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      return new Promise((resolve, reject) => {
        service.getDetails({
          placeId,
          fields: ['name', 'rating', 'formatted_phone_number', 'geometry', 'photos', 'reviews', 'website', 'opening_hours']
        }, (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {
            reject(new Error('Place details fetch failed'));
          }
        });
      });
    } catch (error) {
      console.error('Place details error:', error);
      throw new Error('Failed to get place details');
    }
  }

  addMarker(position: { lat: number; lng: number }, title: string, type: 'hotel' | 'restaurant' | 'attraction' | 'danger') {
    if (!this.map) return null;

    const icons = {
      hotel: '🏨',
      restaurant: '🍽️',
      attraction: '🎯',
      danger: '⚠️'
    };

    const marker = new google.maps.Marker({
      position,
      map: this.map,
      title,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" fill="${type === 'danger' ? '#ef4444' : '#3b82f6'}" stroke="white" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" font-size="16">${icons[type]}</text>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(32, 32)
      }
    });

    this.markers.push(marker);
    return marker;
  }

  clearMarkers() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
  }

  async calculateRoute(waypoints: { lat: number; lng: number }[]) {
    if (!this.map || waypoints.length < 2 || !this.loader) return null;

    try {
      await this.loader.load();
      
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer();
      
      directionsRenderer.setMap(this.map);

      const request = {
        origin: waypoints[0],
        destination: waypoints[waypoints.length - 1],
        waypoints: waypoints.slice(1, -1).map(point => ({ location: point, stopover: true })),
        travelMode: google.maps.TravelMode.DRIVING
      };

      return new Promise((resolve, reject) => {
        directionsService.route(request, (result, status) => {
          if (status === 'OK' && result) {
            directionsRenderer.setDirections(result);
            resolve(result);
          } else {
            reject(new Error('Route calculation failed'));
          }
        });
      });
    } catch (error) {
      console.error('Route calculation error:', error);
      throw new Error('Failed to calculate route');
    }
  }
}

export const mapsService = new MapsService();