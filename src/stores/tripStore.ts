import { create } from 'zustand'
import { Trip, ChatMessage } from '../types'
import { supabaseService } from '../services/supabaseService'

interface TripState {
  currentTrip: Trip | null
  trips: Trip[]
  chatMessages: ChatMessage[]
  currentSessionId: string | null
  isLoading: boolean
  createTrip: (tripData: Partial<Trip>) => Promise<Trip>
  updateTrip: (tripId: string, updates: Partial<Trip>) => Promise<void>
  deleteTrip: (tripId: string) => Promise<void>
  loadTrips: () => Promise<void>
  setCurrentTrip: (trip: Trip | null) => void
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
  generateItinerary: (preferences: any) => Promise<void>
  sendChatMessage: (message: string) => Promise<void>
  loadChatMessages: (sessionId: string) => Promise<void>
}

export const useTripStore = create<TripState>((set, get) => ({
  currentTrip: null,
  trips: [],
  chatMessages: [],
  currentSessionId: null,
  isLoading: false,

  createTrip: async (tripData: Partial<Trip>) => {
    set({ isLoading: true })
    try {
      const trip = await supabaseService.createTrip(tripData)
      const { trips } = get()
      set({ trips: [trip, ...trips], currentTrip: trip, isLoading: false })
      return trip
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  updateTrip: async (tripId: string, updates: Partial<Trip>) => {
    set({ isLoading: true })
    try {
      await supabaseService.updateTrip(tripId, updates)
      
      const { trips, currentTrip } = get()
      const updatedTrips = trips.map(trip => 
        trip.id === tripId 
          ? { ...trip, ...updates, updatedAt: new Date().toISOString() }
          : trip
      )
      
      const updatedCurrentTrip = currentTrip?.id === tripId 
        ? { ...currentTrip, ...updates, updatedAt: new Date().toISOString() }
        : currentTrip
      
      set({ trips: updatedTrips, currentTrip: updatedCurrentTrip, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  deleteTrip: async (tripId: string) => {
    set({ isLoading: true })
    try {
      await supabaseService.deleteTrip(tripId)
      
      const { trips, currentTrip } = get()
      const updatedTrips = trips.filter(trip => trip.id !== tripId)
      const updatedCurrentTrip = currentTrip?.id === tripId ? null : currentTrip
      
      set({ trips: updatedTrips, currentTrip: updatedCurrentTrip, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  loadTrips: async () => {
    set({ isLoading: true })
    try {
      const trips = await supabaseService.getTrips()
      set({ trips, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to load trips:', error)
    }
  },

  setCurrentTrip: (trip: Trip | null) => {
    set({ currentTrip: trip })
  },

  addChatMessage: (message: ChatMessage) => {
    const { chatMessages } = get()
    set({ chatMessages: [...chatMessages, message] })
  },

  clearChat: () => {
    set({ chatMessages: [], currentSessionId: null })
  },

  generateItinerary: async (preferences: any) => {
    const { currentTrip } = get()
    if (!currentTrip) throw new Error('No current trip')

    set({ isLoading: true })
    try {
      const itinerary = await supabaseService.generateItinerary(currentTrip.id, preferences)
      
      // Reload the trip to get the updated itinerary
      const updatedTrip = await supabaseService.getTrip(currentTrip.id)
      set({ currentTrip: updatedTrip, isLoading: false })
      
      return itinerary
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  sendChatMessage: async (message: string) => {
    const { currentTrip, currentSessionId } = get()
    
    try {
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        type: 'text',
      }
      
      get().addChatMessage(userMessage)

      // Send to AI and get response
      const response = await supabaseService.chatWithAI(
        message, 
        currentSessionId || undefined, 
        currentTrip?.id,
        { currentTrip }
      )

      // Update session ID if new
      if (response.sessionId && !currentSessionId) {
        set({ currentSessionId: response.sessionId })
      }

      // Add AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        type: 'text',
      }
      
      get().addChatMessage(aiMessage)
    } catch (error) {
      console.error('Chat error:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        type: 'text',
      }
      
      get().addChatMessage(errorMessage)
    }
  },

  loadChatMessages: async (sessionId: string) => {
    try {
      const messages = await supabaseService.getChatMessages(sessionId)
      set({ chatMessages: messages, currentSessionId: sessionId })
    } catch (error) {
      console.error('Failed to load chat messages:', error)
    }
  },
}))