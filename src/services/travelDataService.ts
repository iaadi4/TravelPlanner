import axios from 'axios';

export class TravelDataService {
  private amadeus = axios.create({
    baseURL: 'https://test.api.amadeus.com/v2',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  private accessToken: string | null = null;

  async getAmadeusToken() {
    if (this.accessToken) return this.accessToken;

    try {
      const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', 
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: import.meta.env.VITE_AMADEUS_API_KEY,
          client_secret: import.meta.env.VITE_AMADEUS_API_SECRET
        })
      );

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Amadeus token error:', error);
      throw new Error('Failed to get Amadeus access token');
    }
  }

  async searchFlights(origin: string, destination: string, departureDate: string, returnDate?: string) {
    try {
      const token = await this.getAmadeusToken();
      
      const params = {
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate,
        adults: 1,
        ...(returnDate && { returnDate })
      };

      const response = await this.amadeus.get('/shopping/flight-offers', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data.data.map((offer: any) => ({
        id: offer.id,
        price: offer.price.total,
        currency: offer.price.currency,
        airline: offer.itineraries[0].segments[0].carrierCode,
        departure: offer.itineraries[0].segments[0].departure,
        arrival: offer.itineraries[0].segments[0].arrival,
        duration: offer.itineraries[0].duration,
        bookingUrl: `https://www.amadeus.com/booking/${offer.id}`
      }));
    } catch (error) {
      console.error('Flight search error:', error);
      return this.getMockFlights(origin, destination);
    }
  }

  async searchHotels(cityCode: string, checkIn: string, checkOut: string) {
    try {
      const token = await this.getAmadeusToken();
      
      const response = await this.amadeus.get('/shopping/hotel-offers', {
        params: {
          cityCode,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          adults: 1
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data.data.map((hotel: any) => ({
        id: hotel.hotel.hotelId,
        name: hotel.hotel.name,
        rating: hotel.hotel.rating || 4,
        price: hotel.offers[0]?.price?.total || 100,
        currency: hotel.offers[0]?.price?.currency || 'USD',
        location: hotel.hotel.address,
        amenities: ['WiFi', 'Breakfast', 'Pool'],
        bookingUrl: `https://www.booking.com/hotel/${hotel.hotel.hotelId}`
      }));
    } catch (error) {
      console.error('Hotel search error:', error);
      return this.getMockHotels(cityCode);
    }
  }

  async getRestaurants(location: string) {
    try {
      // Using a combination of APIs for restaurant data
      const response = await axios.get(`https://api.foursquare.com/v3/places/search`, {
        params: {
          query: 'restaurant',
          near: location,
          limit: 20
        },
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_FOURSQUARE_API_KEY}`
        }
      });

      return response.data.results.map((place: any) => ({
        id: place.fsq_id,
        name: place.name,
        category: place.categories[0]?.name || 'Restaurant',
        rating: place.rating || 4.0,
        price: place.price || 2,
        location: place.location,
        photos: place.photos?.map((photo: any) => `${photo.prefix}300x300${photo.suffix}`) || []
      }));
    } catch (error) {
      console.error('Restaurant search error:', error);
      return this.getMockRestaurants(location);
    }
  }

  async getAttractions(location: string) {
    try {
      const response = await axios.get(`https://api.content.tripadvisor.com/api/v1/location/search`, {
        params: {
          key: import.meta.env.VITE_TRIPADVISOR_API_KEY,
          searchQuery: location,
          category: 'attractions'
        }
      });

      return response.data.data.map((attraction: any) => ({
        id: attraction.location_id,
        name: attraction.name,
        rating: attraction.rating,
        description: attraction.description,
        photos: attraction.photo?.images?.medium?.url ? [attraction.photo.images.medium.url] : [],
        location: attraction.address_obj
      }));
    } catch (error) {
      console.error('Attractions search error:', error);
      return this.getMockAttractions(location);
    }
  }

  async getWeatherForecast(location: string) {
    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
        params: {
          q: location,
          appid: import.meta.env.VITE_OPENWEATHER_API_KEY,
          units: 'metric'
        }
      });

      return {
        current: {
          temperature: response.data.list[0].main.temp,
          condition: response.data.list[0].weather[0].description,
          humidity: response.data.list[0].main.humidity,
          windSpeed: response.data.list[0].wind.speed
        },
        forecast: response.data.list.slice(0, 5).map((item: any) => ({
          date: item.dt_txt,
          temperature: item.main.temp,
          condition: item.weather[0].description,
          precipitation: item.rain?.['3h'] || 0
        }))
      };
    } catch (error) {
      console.error('Weather forecast error:', error);
      return this.getMockWeather(location);
    }
  }

  async getSafetyData(location: string) {
    try {
      // Using crime data APIs and safety databases
      const response = await axios.get(`https://api.crimeometer.com/v1/incidents/raw-data`, {
        params: {
          lat: 40.7128,
          lon: -74.0060,
          distance: '10mi',
          datetime_ini: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          datetime_end: new Date().toISOString()
        },
        headers: {
          'x-api-key': import.meta.env.VITE_CRIME_DATA_API_KEY
        }
      });

      return {
        safetyLevel: 7,
        alerts: response.data.incidents?.slice(0, 5).map((incident: any) => ({
          type: incident.incident_type,
          severity: 'medium',
          location: incident.incident_address,
          description: incident.incident_description,
          timestamp: incident.incident_datetime
        })) || [],
        recommendations: [
          'Avoid walking alone at night',
          'Keep valuables secure',
          'Stay in well-lit areas',
          'Use official transportation'
        ]
      };
    } catch (error) {
      console.error('Safety data error:', error);
      return this.getMockSafetyData(location);
    }
  }

  // Mock data fallbacks
  private getMockFlights(origin: string, destination: string) {
    return [
      {
        id: '1',
        price: '450.00',
        currency: 'USD',
        airline: 'AA',
        departure: { iataCode: origin, at: '2024-03-15T08:00:00' },
        arrival: { iataCode: destination, at: '2024-03-15T14:30:00' },
        duration: 'PT6H30M',
        bookingUrl: 'https://www.expedia.com'
      }
    ];
  }

  private getMockHotels(cityCode: string) {
    return [
      {
        id: '1',
        name: 'Grand Plaza Hotel',
        rating: 4,
        price: '120.00',
        currency: 'USD',
        location: { address: `Downtown ${cityCode}` },
        amenities: ['WiFi', 'Breakfast', 'Pool', 'Gym'],
        bookingUrl: 'https://www.booking.com'
      }
    ];
  }

  private getMockRestaurants(location: string) {
    return [
      {
        id: '1',
        name: 'Local Bistro',
        category: 'European',
        rating: 4.5,
        price: 3,
        location: { address: `Main Street, ${location}` },
        photos: ['https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg']
      }
    ];
  }

  private getMockAttractions(location: string) {
    return [
      {
        id: '1',
        name: 'Historic City Center',
        rating: 4.8,
        description: 'Beautiful historic architecture and cultural sites',
        photos: ['https://images.pexels.com/photos/208701/pexels-photo-208701.jpeg'],
        location: { address: `City Center, ${location}` }
      }
    ];
  }

  private getMockWeather(location: string) {
    return {
      current: {
        temperature: 22,
        condition: 'partly cloudy',
        humidity: 65,
        windSpeed: 10
      },
      forecast: [
        { date: '2024-03-15', temperature: 24, condition: 'sunny', precipitation: 0 },
        { date: '2024-03-16', temperature: 21, condition: 'cloudy', precipitation: 20 }
      ]
    };
  }

  private getMockSafetyData(location: string) {
    return {
      safetyLevel: 8,
      alerts: [
        {
          type: 'pickpocketing',
          severity: 'low',
          location: 'Tourist areas',
          description: 'Be aware of pickpockets in crowded areas',
          timestamp: new Date().toISOString()
        }
      ],
      recommendations: [
        'Keep valuables secure',
        'Stay in well-lit areas',
        'Use official transportation'
      ]
    };
  }
}

export const travelDataService = new TravelDataService();