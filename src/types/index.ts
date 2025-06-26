export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro';
  createdAt: string;
}

export interface Trip {
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelers: number;
  status: 'planning' | 'completed' | 'cancelled';
  itinerary: DayPlan[];
  preferences: TravelPreferences;
  createdAt: string;
  updatedAt: string;
  shareId?: string;
}

export interface TravelPreferences {
  budget: string;
  travelStyle: 'budget' | 'comfort' | 'luxury';
  interests: string[];
  dietaryRestrictions: string[];
  accommodationType: 'hotel' | 'hostel' | 'apartment' | 'any';
  transportPreference: 'flight' | 'train' | 'bus' | 'car' | 'any';
}

export interface DayPlan {
  day: number;
  date: string;
  activities: Activity[];
  accommodation?: Accommodation;
  transportation?: Transportation[];
  meals: Meal[];
  budget: number;
  notes?: string;
}

export interface Activity {
  id: string;
  name: string;
  type: 'attraction' | 'experience' | 'tour' | 'rest';
  description: string;
  location: Location;
  duration: number; // in minutes
  cost: number;
  rating?: number;
  bookingUrl?: string;
  images?: string[];
  tips?: string[];
  timeSlot: string;
}

export interface Location {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export interface Accommodation {
  id: string;
  name: string;
  type: 'hotel' | 'hostel' | 'apartment' | 'resort';
  location: Location;
  pricePerNight: number;
  rating: number;
  amenities: string[];
  bookingUrl?: string;
  images?: string[];
  checkIn: string;
  checkOut: string;
}

export interface Transportation {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'taxi' | 'rental';
  from: Location;
  to: Location;
  departureTime: string;
  arrivalTime: string;
  cost: number;
  duration: number;
  bookingUrl?: string;
  provider: string;
}

export interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  location: Location;
  cuisine: string;
  cost: number;
  rating?: number;
  description?: string;
  bookingUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: 'text' | 'options' | 'form' | 'map' | 'summary';
  data?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WeatherData {
  location: string;
  current: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  };
  forecast: {
    date: string;
    high: number;
    low: number;
    condition: string;
    precipitation: number;
  }[];
}

export interface SafetyAlert {
  type: 'crime' | 'weather' | 'health' | 'traffic';
  severity: 'low' | 'medium' | 'high';
  location: string;
  message: string;
  source: string;
  timestamp: string;
}