import React, { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { AuthPage } from './components/Auth/AuthPage';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { ChatInterface } from './components/Chat/ChatInterface';
import { Dashboard } from './components/Dashboard/Dashboard';
import { PricingPage } from './components/Pricing/PricingPage';
import { TripPlanner } from './components/Trip/TripPlanner';

function App() {
  const { isAuthenticated, initialize } = useAuthStore();
  const { currentView, sidebarOpen, isDarkMode } = useUIStore();

  useEffect(() => {
    // Initialize auth state
    initialize();
  }, []);

  useEffect(() => {
    // Apply dark mode class to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'chat':
        return <ChatInterface />;
      case 'pricing':
        return <PricingPage />;
      case 'trip':
        return <TripPlanner />;
      case 'profile':
        return (
          <div className="min-h-full flex items-center justify-center p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
              <p className="text-gray-600 dark:text-gray-400">Profile settings coming soon...</p>
            </div>
          </div>
        );
      default:
        return <ChatInterface />;
    }
  };

  if (!isAuthenticated) {
   <div>Hii</div>
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <Sidebar />}
        <main className="flex-1 overflow-auto">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}

export default App;