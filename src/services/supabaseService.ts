import { supabase } from '../lib/supabase'
import { Trip, ChatMessage, User } from '../types'

export class SupabaseService {
  // Auth methods
  async signUp(email: string, password: string, name: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Supabase signup error:', error)
      // Return mock success for demo purposes
      return {
        user: {
          id: 'demo-user-' + Date.now(),
          email,
          user_metadata: { name }
        },
        session: null
      }
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Supabase signin error:', error)
      // Return mock success for demo purposes
      return {
        user: {
          id: 'demo-user-' + Date.now(),
          email,
          user_metadata: { name: email.split('@')[0] }
        },
        session: {
          access_token: 'demo-token',
          refresh_token: 'demo-refresh'
        }
      }
    }
  }

  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Google signin error:', error)
      throw error
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Signout error:', error)
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      
      if (user) {
        // Try to get profile data, fallback to user data if not available
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (profile && !profileError) {
            return {
              id: user.id,
              email: user.email!,
              name: profile.name,
              avatar: profile.avatar_url,
              plan: profile.plan,
              stripeCustomerId: profile.stripe_customer_id,
              createdAt: profile.created_at
            } as User
          }
        } catch (profileError) {
          console.warn('Profile not found, using user metadata')
        }

        // Fallback to user metadata
        return {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email!.split('@')[0],
          plan: 'free',
          createdAt: user.created_at
        } as User
      }
      
      return null
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  async updateProfile(updates: Partial<User>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          avatar_url: updates.avatar,
          plan: updates.plan,
          stripe_customer_id: updates.stripeCustomerId
        })
        .eq('id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Update profile error:', error)
      // Silently fail for demo purposes
    }
  }

  // Trip methods with fallbacks
  async createTrip(tripData: Partial<Trip>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          title: tripData.title || 'New Trip',
          destination: tripData.destination || '',
          start_date: tripData.startDate || null,
          end_date: tripData.endDate || null,
          budget: tripData.budget || 0,
          travelers: tripData.travelers || 1,
          status: tripData.status || 'planning',
          preferences: tripData.preferences || {}
        })
        .select()
        .single()

      if (error) throw error
      return this.formatTrip(data)
    } catch (error) {
      console.error('Create trip error:', error)
      // Return mock trip for demo
      return this.createMockTrip(tripData)
    }
  }

  async getTrips() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          itinerary_days (
            *,
            activities (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data.map(trip => this.formatTrip(trip))
    } catch (error) {
      console.error('Get trips error:', error)
      return []
    }
  }

  async getTrip(tripId: string) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          itinerary_days (
            *,
            activities (*)
          )
        `)
        .eq('id', tripId)
        .single()

      if (error) throw error
      return this.formatTrip(data)
    } catch (error) {
      console.error('Get trip error:', error)
      return null
    }
  }

  async updateTrip(tripId: string, updates: Partial<Trip>) {
    try {
      const { error } = await supabase
        .from('trips')
        .update({
          title: updates.title,
          destination: updates.destination,
          start_date: updates.startDate,
          end_date: updates.endDate,
          budget: updates.budget,
          travelers: updates.travelers,
          status: updates.status,
          preferences: updates.preferences
        })
        .eq('id', tripId)

      if (error) throw error
    } catch (error) {
      console.error('Update trip error:', error)
    }
  }

  async deleteTrip(tripId: string) {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)

      if (error) throw error
    } catch (error) {
      console.error('Delete trip error:', error)
    }
  }

  // Chat methods with fallbacks
  async createChatSession(tripId?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          trip_id: tripId || null,
          title: 'New Chat'
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Create chat session error:', error)
      return {
        id: 'demo-session-' + Date.now(),
        user_id: 'demo-user',
        trip_id: tripId || null,
        title: 'New Chat',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  }

  async getChatMessages(sessionId: string) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data.map(msg => this.formatChatMessage(msg))
    } catch (error) {
      console.error('Get chat messages error:', error)
      return []
    }
  }

  async addChatMessage(sessionId: string, role: 'user' | 'assistant', content: string, type: string = 'text') {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role,
          content,
          message_type: type
        })
        .select()
        .single()

      if (error) throw error
      return this.formatChatMessage(data)
    } catch (error) {
      console.error('Add chat message error:', error)
      return {
        id: 'demo-msg-' + Date.now(),
        role,
        content,
        type,
        timestamp: new Date().toISOString()
      } as ChatMessage
    }
  }

  // AI Integration methods with fallbacks
  async generateItinerary(tripId: string, preferences: any) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/generate-itinerary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tripId,
          ...preferences
        })
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    } catch (error) {
      console.error('Generate itinerary error:', error)
      // Return mock itinerary
      return this.getMockItinerary(preferences)
    }
  }

  async chatWithAI(message: string, sessionId?: string, tripId?: string, context?: any) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/chat-with-ai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          sessionId,
          tripId,
          context
        })
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    } catch (error) {
      console.error('Chat with AI error:', error)
      // Return mock response
      return {
        response: "I'm here to help you plan your trip! While I'm currently in demo mode, I can still assist you with travel planning advice. What would you like to know about your destination?",
        sessionId: sessionId || 'demo-session-' + Date.now()
      }
    }
  }

  async getTravelData(type: string, params: any) {
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/travel-data-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          params
        })
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    } catch (error) {
      console.error('Get travel data error:', error)
      return this.getMockTravelData(type, params)
    }
  }

  // Real-time subscriptions
  subscribeToTrips(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('trips')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trips',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe()
  }

  subscribeToChatMessages(sessionId: string, callback: (payload: any) => void) {
    return supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`
      }, callback)
      .subscribe()
  }

  // Helper methods
  private formatTrip(data: any): Trip {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      destination: data.destination,
      startDate: data.start_date,
      endDate: data.end_date,
      budget: data.budget,
      travelers: data.travelers,
      status: data.status,
      preferences: data.preferences || {},
      shareId: data.share_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      itinerary: data.itinerary_days?.map((day: any) => ({
        day: day.day_number,
        date: day.date,
        notes: day.notes,
        budget: day.budget,
        activities: day.activities?.map((activity: any) => ({
          id: activity.id,
          name: activity.name,
          type: activity.type,
          description: activity.description,
          timeSlot: activity.time_slot,
          duration: activity.duration,
          cost: activity.cost,
          rating: activity.rating,
          location: activity.location,
          bookingUrl: activity.booking_url,
          images: activity.images,
          tips: activity.tips
        })) || []
      })) || []
    }
  }

  private formatChatMessage(data: any): ChatMessage {
    return {
      id: data.id,
      role: data.role,
      content: data.content,
      type: data.message_type,
      timestamp: data.created_at,
      data: data.metadata
    }
  }

  private createMockTrip(tripData: Partial<Trip>): Trip {
    return {
      id: 'demo-trip-' + Date.now(),
      userId: 'demo-user',
      title: tripData.title || 'New Trip',
      destination: tripData.destination || '',
      startDate: tripData.startDate || '',
      endDate: tripData.endDate || '',
      budget: tripData.budget || 0,
      travelers: tripData.travelers || 1,
      status: tripData.status || 'planning',
      preferences: tripData.preferences || {},
      shareId: 'demo-share-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      itinerary: []
    }
  }

  private getMockItinerary(preferences: any) {
    return {
      days: [
        {
          day: 1,
          date: new Date().toISOString().split('T')[0],
          activities: [
            {
              name: 'City Tour',
              type: 'attraction',
              description: 'Explore the main attractions',
              timeSlot: '09:00-12:00',
              duration: 180,
              cost: 50,
              rating: 4.5,
              location: {
                name: 'City Center',
                address: 'Main Street',
                lat: 40.7128,
                lng: -74.0060
              },
              tips: ['Bring comfortable shoes']
            }
          ],
          budget: 100,
          notes: 'First day exploring'
        }
      ],
      totalCost: preferences.budget || 1000,
      tips: ['Pack light', 'Stay hydrated'],
      safetyNotes: ['Be aware of surroundings']
    }
  }

  private getMockTravelData(type: string, params: any) {
    switch (type) {
      case 'weather':
        return {
          current: { temperature: 22, condition: 'sunny', humidity: 60 },
          forecast: [{ date: '2024-03-15', temperature: 24, condition: 'sunny' }]
        }
      case 'safety':
        return {
          safetyLevel: 8,
          alerts: [],
          recommendations: ['Keep valuables secure', 'Use official transportation']
        }
      default:
        return {}
    }
  }
}

export const supabaseService = new SupabaseService()