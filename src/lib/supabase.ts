import { createClient } from '@supabase/supabase-js'

// Use placeholder values if environment variables are not set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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