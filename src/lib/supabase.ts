import { createClient } from '@supabase/supabase-js'

// Check if environment variables are properly set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate that we have proper Supabase credentials
const hasValidCredentials = supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseAnonKey.includes('placeholder') &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')

if (!hasValidCredentials) {
  console.warn('Supabase credentials not configured. Running in demo mode. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
}

// Create a mock client if credentials are not available
const createMockClient = () => ({
  auth: {
    signUp: () => Promise.resolve({ 
      data: { 
        user: { 
          id: 'demo-user-' + Date.now(), 
          email: 'demo@example.com',
          user_metadata: { name: 'Demo User' }
        }, 
        session: null 
      }, 
      error: null 
    }),
    signInWithPassword: () => Promise.resolve({ 
      data: { 
        user: { 
          id: 'demo-user-' + Date.now(), 
          email: 'demo@example.com',
          user_metadata: { name: 'Demo User' }
        }, 
        session: { access_token: 'demo-token' }
      }, 
      error: null 
    }),
    signInWithOAuth: () => Promise.resolve({ data: { url: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    getUser: () => Promise.resolve({ 
      data: { 
        user: { 
          id: 'demo-user', 
          email: 'demo@example.com',
          user_metadata: { name: 'Demo User' },
          created_at: new Date().toISOString()
        } 
      }, 
      error: null 
    }),
    getSession: () => Promise.resolve({ 
      data: { session: { access_token: 'demo-token' } }, 
      error: null 
    }),
    onAuthStateChange: (callback: any) => {
      // Simulate auth state change for demo
      setTimeout(() => {
        callback('SIGNED_IN', { 
          access_token: 'demo-token',
          user: { 
            id: 'demo-user', 
            email: 'demo@example.com',
            user_metadata: { name: 'Demo User' }
          }
        })
      }, 100)
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {} 
          } 
        } 
      }
    }
  },
  from: (table: string) => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    eq: function() { return this },
    single: function() { return this },
    order: function() { return this }
  }),
  channel: () => ({
    on: () => ({ subscribe: () => {} })
  }),
  supabaseUrl: hasValidCredentials ? supabaseUrl : 'https://demo.supabase.co'
})

export const supabase = hasValidCredentials
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient()

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          plan: 'free' | 'pro'
          stripe_customer_id: string | null
          preferences: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string | null
          plan?: 'free' | 'pro'
          stripe_customer_id?: string | null
          preferences?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          plan?: 'free' | 'pro'
          stripe_customer_id?: string | null
          preferences?: any
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          user_id: string
          title: string
          destination: string
          start_date: string | null
          end_date: string | null
          budget: number
          travelers: number
          status: 'planning' | 'completed' | 'cancelled'
          preferences: any
          share_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          destination?: string
          start_date?: string | null
          end_date?: string | null
          budget?: number
          travelers?: number
          status?: 'planning' | 'completed' | 'cancelled'
          preferences?: any
          share_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          destination?: string
          start_date?: string | null
          end_date?: string | null
          budget?: number
          travelers?: number
          status?: 'planning' | 'completed' | 'cancelled'
          preferences?: any
          share_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      itinerary_days: {
        Row: {
          id: string
          trip_id: string
          day_number: number
          date: string
          notes: string
          budget: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          day_number: number
          date: string
          notes?: string
          budget?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          day_number?: number
          date?: string
          notes?: string
          budget?: number
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          itinerary_day_id: string
          name: string
          type: 'attraction' | 'experience' | 'tour' | 'rest' | 'meal' | 'transport'
          description: string
          time_slot: string
          duration: number
          cost: number
          rating: number | null
          location: any
          booking_url: string | null
          images: string[]
          tips: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          itinerary_day_id: string
          name: string
          type?: 'attraction' | 'experience' | 'tour' | 'rest' | 'meal' | 'transport'
          description?: string
          time_slot?: string
          duration?: number
          cost?: number
          rating?: number | null
          location?: any
          booking_url?: string | null
          images?: string[]
          tips?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          itinerary_day_id?: string
          name?: string
          type?: 'attraction' | 'experience' | 'tour' | 'rest' | 'meal' | 'transport'
          description?: string
          time_slot?: string
          duration?: number
          cost?: number
          rating?: number | null
          location?: any
          booking_url?: string | null
          images?: string[]
          tips?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          trip_id: string | null
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          trip_id?: string | null
          title?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          trip_id?: string | null
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          message_type: 'text' | 'options' | 'form' | 'map' | 'summary'
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          message_type?: 'text' | 'options' | 'form' | 'map' | 'summary'
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant'
          content?: string
          message_type?: 'text' | 'options' | 'form' | 'map' | 'summary'
          metadata?: any
          created_at?: string
        }
      }
    }
  }
}