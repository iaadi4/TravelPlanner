import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.12.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatRequest {
  message: string
  sessionId?: string
  tripId?: string
  context?: any
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

    const { message, sessionId, tripId, context }: ChatRequest = await req.json()

    // Get or create chat session
    let currentSessionId = sessionId
    if (!currentSessionId) {
      const { data: newSession, error: sessionError } = await supabaseClient
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          trip_id: tripId,
          title: message.substring(0, 50) + '...'
        })
        .select()
        .single()

      if (sessionError) {
        throw new Error('Failed to create chat session')
      }
      currentSessionId = newSession.id
    }

    // Store user message
    const { error: userMessageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        role: 'user',
        content: message,
        message_type: 'text'
      })

    if (userMessageError) {
      console.error('Failed to store user message:', userMessageError)
    }

    // Get recent chat history for context
    const { data: recentMessages } = await supabaseClient
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get trip context if available
    let tripContext = ''
    if (tripId) {
      const { data: trip } = await supabaseClient
        .from('trips')
        .select('*, itinerary_days(*, activities(*))')
        .eq('id', tripId)
        .single()

      if (trip) {
        tripContext = `
        Current Trip Context:
        - Destination: ${trip.destination}
        - Dates: ${trip.start_date} to ${trip.end_date}
        - Budget: $${trip.budget}
        - Travelers: ${trip.travelers}
        - Status: ${trip.status}
        - Preferences: ${JSON.stringify(trip.preferences)}
        `
      }
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '')
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // Build conversation context
    const conversationHistory = recentMessages
      ?.reverse()
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n') || ''

    const prompt = `
      You are TravelHelperAI, an expert travel planning assistant. You help users plan amazing trips with personalized recommendations, real-time data, and practical advice.

      ${tripContext}

      Recent conversation:
      ${conversationHistory}

      Current user message: ${message}

      Please provide a helpful, engaging response that:
      1. Addresses the user's specific question or request
      2. Offers practical travel advice and recommendations
      3. Considers their budget, preferences, and trip context
      4. Suggests next steps or follow-up questions when appropriate
      5. Maintains a friendly, professional tone

      If the user is asking about:
      - Flights: Suggest checking multiple airlines and booking sites
      - Hotels: Recommend different accommodation types based on their budget
      - Activities: Provide specific recommendations with estimated costs and timing
      - Weather: Give seasonal advice and packing suggestions
      - Safety: Offer current safety tips and precautions
      - Local culture: Share cultural insights and etiquette tips

      Keep responses conversational and actionable. If you need more information to provide better recommendations, ask specific follow-up questions.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const aiResponse = response.text()

    // Store AI response
    const { error: aiMessageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        role: 'assistant',
        content: aiResponse,
        message_type: 'text'
      })

    if (aiMessageError) {
      console.error('Failed to store AI message:', aiMessageError)
    }

    // Store the generation request
    const { error: generationError } = await supabaseClient
      .from('ai_generations')
      .insert({
        user_id: user.id,
        trip_id: tripId,
        generation_type: 'chat_response',
        input_data: { message, context },
        output_data: { response: aiResponse },
        status: 'completed'
      })

    if (generationError) {
      console.error('Failed to store generation:', generationError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          response: aiResponse,
          sessionId: currentSessionId
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Chat error:', error)
    
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