import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface TravelDataRequest {
  type: 'flights' | 'hotels' | 'weather' | 'safety' | 'restaurants'
  params: Record<string, any>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type, params }: TravelDataRequest = await req.json()

    let data
    switch (type) {
      case 'flights':
        data = await fetchFlightData(params)
        break
      case 'hotels':
        data = await fetchHotelData(params)
        break
      case 'weather':
        data = await fetchWeatherData(params, supabaseClient)
        break
      case 'safety':
        data = await fetchSafetyData(params, supabaseClient)
        break
      case 'restaurants':
        data = await fetchRestaurantData(params)
        break
      default:
        throw new Error('Invalid data type requested')
    }

    return new Response(
      JSON.stringify({
        success: true,
        data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Travel data proxy error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function fetchFlightData(params: any) {
  // Check if we have Amadeus credentials
  const amadeusKey = Deno.env.get('AMADEUS_API_KEY')
  const amadeusSecret = Deno.env.get('AMADEUS_API_SECRET')
  
  if (!amadeusKey || !amadeusSecret) {
    return getMockFlightData(params)
  }

  try {
    // Get Amadeus access token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: amadeusKey,
        client_secret: amadeusSecret
      })
    })

    const tokenData = await tokenResponse.json()
    
    // Search flights
    const flightResponse = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?${new URLSearchParams(params)}`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    const flightData = await flightResponse.json()
    return flightData.data || []
  } catch (error) {
    console.error('Amadeus API error:', error)
    return getMockFlightData(params)
  }
}

async function fetchHotelData(params: any) {
  // Return mock data for now - integrate with Booking.com or Hotels.com API
  return getMockHotelData(params)
}

async function fetchWeatherData(params: any, supabaseClient: any) {
  const { location } = params
  
  // Check cache first
  const { data: cachedWeather } = await supabaseClient
    .from('cached_weather')
    .select('*')
    .eq('location', location)
    .gte('last_updated', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // 1 hour cache
    .single()

  if (cachedWeather) {
    return {
      current: cachedWeather.weather_data,
      forecast: cachedWeather.forecast_data
    }
  }

  // Fetch from OpenWeather API
  const weatherKey = Deno.env.get('OPENWEATHER_API_KEY')
  if (!weatherKey) {
    return getMockWeatherData(location)
  }

  try {
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${weatherKey}&units=metric`
    )
    const weatherData = await weatherResponse.json()

    const processedData = {
      current: {
        temperature: weatherData.list[0].main.temp,
        condition: weatherData.list[0].weather[0].description,
        humidity: weatherData.list[0].main.humidity,
        windSpeed: weatherData.list[0].wind.speed
      },
      forecast: weatherData.list.slice(0, 5).map((item: any) => ({
        date: item.dt_txt,
        temperature: item.main.temp,
        condition: item.weather[0].description,
        precipitation: item.rain?.['3h'] || 0
      }))
    }

    // Cache the result
    await supabaseClient
      .from('cached_weather')
      .upsert({
        location,
        weather_data: processedData.current,
        forecast_data: processedData.forecast,
        last_updated: new Date().toISOString()
      })

    return processedData
  } catch (error) {
    console.error('Weather API error:', error)
    return getMockWeatherData(location)
  }
}

async function fetchSafetyData(params: any, supabaseClient: any) {
  const { location } = params
  
  // Check cache first
  const { data: cachedSafety } = await supabaseClient
    .from('cached_safety_data')
    .select('*')
    .eq('location', location)
    .gte('last_updated', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24 hour cache
    .single()

  if (cachedSafety) {
    return {
      safetyLevel: cachedSafety.safety_level,
      alerts: cachedSafety.alerts,
      recommendations: cachedSafety.recommendations
    }
  }

  // For now, return mock data - integrate with crime/safety APIs
  const mockData = getMockSafetyData(location)
  
  // Cache the result
  await supabaseClient
    .from('cached_safety_data')
    .upsert({
      location,
      safety_level: mockData.safetyLevel,
      alerts: mockData.alerts,
      recommendations: mockData.recommendations,
      last_updated: new Date().toISOString()
    })

  return mockData
}

async function fetchRestaurantData(params: any) {
  // Return mock data for now - integrate with Foursquare or Google Places API
  return getMockRestaurantData(params)
}

// Mock data functions
function getMockFlightData(params: any) {
  return [
    {
      id: '1',
      price: { total: '450.00', currency: 'USD' },
      itineraries: [{
        segments: [{
          carrierCode: 'AA',
          departure: { iataCode: params.originLocationCode, at: '2024-03-15T08:00:00' },
          arrival: { iataCode: params.destinationLocationCode, at: '2024-03-15T14:30:00' }
        }],
        duration: 'PT6H30M'
      }]
    }
  ]
}

function getMockHotelData(params: any) {
  return [
    {
      hotel: {
        hotelId: '1',
        name: 'Grand Plaza Hotel',
        rating: 4,
        address: { cityName: params.cityCode }
      },
      offers: [{
        price: { total: '120.00', currency: 'USD' }
      }]
    }
  ]
}

function getMockWeatherData(location: string) {
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

function getMockSafetyData(location: string) {
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

function getMockRestaurantData(params: any) {
  return [
    {
      fsq_id: '1',
      name: 'Local Bistro',
      categories: [{ name: 'European Restaurant' }],
      rating: 4.5,
      price: 3,
      location: { address: `Main Street, ${params.location}` }
    }
  ]
}