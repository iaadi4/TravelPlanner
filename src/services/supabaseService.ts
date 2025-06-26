import { supabase } from '../lib/supabase'
import { Trip, ChatMessage, User } from '../types'

export class SupabaseService {
  // Auth methods
  async signUp(email: string, password: string, name: string) {
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
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  }

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
    
    if (error) throw error
    return data
  }

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    
    if (user) {
      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) throw profileError
      
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
    
    return null
  }

  async updateProfile(updates: Partial<User>) {
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
  }

  // Trip methods
  async createTrip(tripData: Partial<Trip>) {
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
  }

  async getTrips() {
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
  }

  async getTrip(tripId: string) {
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
  }

  async updateTrip(tripId: string, updates: Partial<Trip>) {
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
  }

  async deleteTrip(tripId: string) {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)

    if (error) throw error
  }

  // Chat methods
  async createChatSession(tripId?: string) {
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
  }

  async getChatMessages(sessionId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data.map(msg => this.formatChatMessage(msg))
  }

  async addChatMessage(sessionId: string, role: 'user' | 'assistant', content: string, type: string = 'text') {
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
  }

  // AI Integration methods
  async generateItinerary(tripId: string, preferences: any) {
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
  }

  async chatWithAI(message: string, sessionId?: string, tripId?: string, context?: any) {
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
  }

  async getTravelData(type: string, params: any) {
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
}

export const supabaseService = new SupabaseService()