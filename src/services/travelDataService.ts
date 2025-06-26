import { supabaseService } from './supabaseService'

export class TravelDataService {
  async searchFlights(origin: string, destination: string, departureDate: string, returnDate?: string) {
    try {
      const params = {
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate,
        adults: 1,
        ...(returnDate && { returnDate })
      }

      const data = await supabaseService.getTravelData('flights', params)
      
      return data.map((offer: any) => ({
        id: offer.id,
        price: offer.price?.total || '0',
        currency: offer.price?.currency || 'USD',
        airline: offer.itineraries?.[0]?.segments?.[0]?.carrierCode || 'Unknown',
        departure: offer.itineraries?.[0]?.segments?.[0]?.departure || {},
        arrival: offer.itineraries?.[0]?.segments?.[0]?.arrival || {},
        duration: offer.itineraries?.[0]?.duration || 'Unknown',
        bookingUrl: `https://www.expedia.com`
      }))
    } catch (error) {
      console.error('Flight search error:', error)
      return this.getMockFlights(origin, destination)
    }
  }

  async searchHotels(cityCode: string, checkIn: string, checkOut: string) {
    try {
      const params = {
        cityCode,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: 1
      }

      const data = await supabaseService.getTravelData('hotels', params)
      
      return data.map((hotel: any) => ({
        id: hotel.hotel?.hotelId || Math.random().toString(),
        name: hotel.hotel?.name || 'Hotel',
        rating: hotel.hotel?.rating || 4,
        price: hotel.offers?.[0]?.price?.total || '100',
        currency: hotel.offers?.[0]?.price?.currency || 'USD',
        location: hotel.hotel?.address || { cityName: cityCode },
        amenities: ['WiFi', 'Breakfast', 'Pool'],
        bookingUrl: `https://www.booking.com`
      }))
    } catch (error) {
      console.error('Hotel search error:', error)
      return this.getMockHotels(cityCode)
    }
  }

  async getRestaurants(location: string) {
    try {
      const data = await supabaseService.getTravelData('restaurants', { location })
      
      return data.map((place: any) => ({
        id: place.fsq_id || Math.random().toString(),
        name: place.name || 'Restaurant',
        category: place.categories?.[0]?.name || 'Restaurant',
        rating: place.rating || 4.0,
        price: place.price || 2,
        location: place.location || { address: location },
        photos: []
      }))
    } catch (error) {
      console.error('Restaurant search error:', error)
      return this.getMockRestaurants(location)
    }
  }

  async getWeatherForecast(location: string) {
    try {
      return await supabaseService.getTravelData('weather', { location })
    } catch (error) {
      console.error('Weather forecast error:', error)
      return this.getMockWeather(location)
    }
  }

  async getSafetyData(location: string) {
    try {
      return await supabaseService.getTravelData('safety', { location })
    } catch (error) {
      console.error('Safety data error:', error)
      return this.getMockSafetyData(location)
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
    ]
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
    ]
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
    ]
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
    }
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
    }
  }
}

export const travelDataService = new TravelDataService()