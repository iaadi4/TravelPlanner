import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.12.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ItineraryRequest {
  tripId: string
  destination: string
  duration: number
  budget: number
  travelers: number
  interests: string[]
  travelStyle: string
  startDate: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Parse request body
    const { tripId, destination, duration, budget, travelers, interests, travelStyle, startDate }: ItineraryRequest = await req.json()

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '')
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // Create detailed prompt for itinerary generation
    const prompt = `
      Create a detailed ${duration}-day travel itinerary for ${destination}.
      
      Trip Details:
      - Destination: ${destination}
      - Duration: ${duration} days
      - Budget: $${budget} total
      - Number of travelers: ${travelers}
      - Travel style: ${travelStyle}
      - Interests: ${interests.join(', ')}
      - Start date: ${startDate}
      
      Please provide a comprehensive day-by-day itinerary that includes:
      1. Daily activities with specific time slots
      2. Restaurant recommendations for meals
      3. Transportation between locations
      4. Estimated costs for each activity
      5. Practical tips and local insights
      6. Safety considerations
      
      Format the response as a JSON object with this exact structure:
      {
        "days": [
          {
            "day": 1,
            "date": "YYYY-MM-DD",
            "activities": [
              {
                "name": "Activity Name",
                "type": "attraction",
                "description": "Detailed description",
                "timeSlot": "09:00-11:00",
                "duration": 120,
                "cost": 25,
                "rating": 4.5,
                "location": {
                  "name": "Location Name",
                  "address": "Full address",
                  "lat": 0.0,
                  "lng": 0.0
                },
                "tips": ["Tip 1", "Tip 2"]
              }
            ],
            "budget": 150,
            "notes": "Daily notes and tips"
          }
        ],
        "totalCost": 1000,
        "tips": ["General trip tips"],
        "safetyNotes": ["Safety recommendations"]
      }
      
      Ensure all costs are realistic and within the total budget. Include a mix of must-see attractions, local experiences, and practical activities.
    `

    // Generate itinerary with Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    const itineraryText = response.text()

    // Parse the JSON response
    let itineraryData
    try {
      // Extract JSON from the response (remove any markdown formatting)
      const jsonMatch = itineraryText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        itineraryData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No valid JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      throw new Error('Failed to parse AI-generated itinerary')
    }

    // Store the generation request
    const { error: generationError } = await supabaseClient
      .from('ai_generations')
      .insert({
        user_id: user.id,
        trip_id: tripId,
        generation_type: 'itinerary',
        input_data: { destination, duration, budget, travelers, interests, travelStyle },
        output_data: itineraryData,
        status: 'completed'
      })

    if (generationError) {
      console.error('Failed to store generation:', generationError)
    }

    // Update the trip with the generated itinerary
    if (itineraryData.days) {
      // First, delete existing itinerary days for this trip
      await supabaseClient
        .from('itinerary_days')
        .delete()
        .eq('trip_id', tripId)

      // Insert new itinerary days and activities
      for (const day of itineraryData.days) {
        const { data: dayData, error: dayError } = await supabaseClient
          .from('itinerary_days')
          .insert({
            trip_id: tripId,
            day_number: day.day,
            date: day.date,
            notes: day.notes || '',
            budget: day.budget || 0
          })
          .select()
          .single()

        if (dayError) {
          console.error('Failed to insert day:', dayError)
          continue
        }

        // Insert activities for this day
        if (day.activities && day.activities.length > 0) {
          const activities = day.activities.map(activity => ({
            itinerary_day_id: dayData.id,
            name: activity.name,
            type: activity.type || 'attraction',
            description: activity.description || '',
            time_slot: activity.timeSlot || '',
            duration: activity.duration || 60,
            cost: activity.cost || 0,
            rating: activity.rating || null,
            location: activity.location || {},
            tips: activity.tips || []
          }))

          const { error: activitiesError } = await supabaseClient
            .from('activities')
            .insert(activities)

          if (activitiesError) {
            console.error('Failed to insert activities:', activitiesError)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: itineraryData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Itinerary generation error:', error)
    
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