import { create } from 'zustand';
import { Trip, ChatMessage } from '../types';

interface TripState {
  currentTrip: Trip | null;
  trips: Trip[];
  chatMessages: ChatMessage[];
  isLoading: boolean;
  createTrip: (tripData: Partial<Trip>) => Promise<Trip>;
  updateTrip: (tripId: string, updates: Partial<Trip>) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  loadTrips: () => Promise<void>;
  setCurrentTrip: (trip: Trip | null) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  generateItinerary: (preferences: any) => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  currentTrip: null,
  trips: [],
  chatMessages: [],
  isLoading: false,

  createTrip: async (tripData: Partial<Trip>) => {
    set({ isLoading: true });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const trip: Trip = {
        id: Date.now().toString(),
        userId: '1',
        title: tripData.title || 'New Trip',
        destination: tripData.destination || '',
        startDate: tripData.startDate || '',
        endDate: tripData.endDate || '',
        budget: tripData.budget || 0,
        travelers: tripData.travelers || 1,
        status: 'planning',
        itinerary: [],
        preferences: tripData.preferences || {
          budget: 'medium',
          travelStyle: 'comfort',
          interests: [],
          dietaryRestrictions: [],
          accommodationType: 'hotel',
          transportPreference: 'any',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const { trips } = get();
      set({ trips: [...trips, trip], currentTrip: trip, isLoading: false });
      return trip;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateTrip: async (tripId: string, updates: Partial<Trip>) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { trips, currentTrip } = get();
      const updatedTrips = trips.map(trip => 
        trip.id === tripId 
          ? { ...trip, ...updates, updatedAt: new Date().toISOString() }
          : trip
      );
      
      const updatedCurrentTrip = currentTrip?.id === tripId 
        ? { ...currentTrip, ...updates, updatedAt: new Date().toISOString() }
        : currentTrip;
      
      set({ trips: updatedTrips, currentTrip: updatedCurrentTrip, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteTrip: async (tripId: string) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { trips, currentTrip } = get();
      const updatedTrips = trips.filter(trip => trip.id !== tripId);
      const updatedCurrentTrip = currentTrip?.id === tripId ? null : currentTrip;
      
      set({ trips: updatedTrips, currentTrip: updatedCurrentTrip, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadTrips: async () => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock trips data
      const mockTrips: Trip[] = [
        {
          id: '1',
          userId: '1',
          title: 'Tokyo Adventure',
          destination: 'Tokyo, Japan',
          startDate: '2024-03-15',
          endDate: '2024-03-22',
          budget: 3000,
          travelers: 2,
          status: 'completed',
          itinerary: [],
          preferences: {
            budget: 'medium',
            travelStyle: 'comfort',
            interests: ['culture', 'food', 'technology'],
            dietaryRestrictions: [],
            accommodationType: 'hotel',
            transportPreference: 'any',
          },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          userId: '1',
          title: 'European Backpacking',
          destination: 'Paris, France',
          startDate: '2024-06-01',
          endDate: '2024-06-14',
          budget: 2500,
          travelers: 1,
          status: 'planning',
          itinerary: [],
          preferences: {
            budget: 'low',
            travelStyle: 'budget',
            interests: ['history', 'art', 'architecture'],
            dietaryRestrictions: ['vegetarian'],
            accommodationType: 'hostel',
            transportPreference: 'train',
          },
          createdAt: '2024-02-01T10:00:00Z',
          updatedAt: '2024-02-01T10:00:00Z',
        },
      ];
      
      set({ trips: mockTrips, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setCurrentTrip: (trip: Trip | null) => {
    set({ currentTrip: trip });
  },

  addChatMessage: (message: ChatMessage) => {
    const { chatMessages } = get();
    set({ chatMessages: [...chatMessages, message] });
  },

  clearChat: () => {
    set({ chatMessages: [] });
  },

  generateItinerary: async (preferences: any) => {
    set({ isLoading: true });
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // This would integrate with Gemini API in production
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));