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
  const { isAuthenticated } = useAuthStore();
  const { currentView, sidebarOpen, isDarkMode } = useUIStore();

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
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Profile settings coming soon...</p>
          </div>
        );
      default:
        return <ChatInterface />;
    }
  };

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
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