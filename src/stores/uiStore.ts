import { create } from 'zustand';

interface UIState {
  isDarkMode: boolean;
  sidebarOpen: boolean;
  currentView: 'chat' | 'dashboard' | 'trip' | 'profile' | 'pricing';
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setCurrentView: (view: UIState['currentView']) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isDarkMode: false,
  sidebarOpen: true,
  currentView: 'chat',

  toggleDarkMode: () => {
    set((state) => {
      const newDarkMode = !state.isDarkMode;
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { isDarkMode: newDarkMode };
    });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setCurrentView: (view: UIState['currentView']) => {
    set({ currentView: view });
  },
}));