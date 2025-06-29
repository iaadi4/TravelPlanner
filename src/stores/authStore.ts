import { create } from 'zustand'
import { User } from '../types'
import { supabaseService } from '../services/supabaseService'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  initialize: async () => {
    try {
      const user = await supabaseService.getCurrentUser()
      set({ user, isAuthenticated: !!user })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ user: null, isAuthenticated: false })
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      await supabaseService.signIn(email, password)
      const user = await supabaseService.getCurrentUser()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true })
    try {
      await supabaseService.signInWithGoogle()
      // User will be set after redirect
      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true })
    try {
      await supabaseService.signUp(email, password, name)
      const user = await supabaseService.getCurrentUser()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    try {
      await supabaseService.signOut()
      set({ user: null, isAuthenticated: false })
    } catch (error) {
      console.error('Logout error:', error)
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    const { user } = get()
    if (!user) return

    set({ isLoading: true })
    try {
      await supabaseService.updateProfile(updates)
      const updatedUser = { ...user, ...updates }
      set({ user: updatedUser, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
}))

// Listen for auth changes with error handling
try {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      const user = await supabaseService.getCurrentUser()
      useAuthStore.setState({ user, isAuthenticated: true })
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ user: null, isAuthenticated: false })
    }
  })
} catch (error) {
  console.warn('Auth state change listener setup failed:', error)
}