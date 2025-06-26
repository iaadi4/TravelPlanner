import React from 'react';
import { Menu, Moon, Sun, User, Bell, Search } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleDarkMode, toggleSidebar } = useUIStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
            TravelHelperAI
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search destinations, trips..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={toggleDarkMode}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>

        <div className="relative group">
          <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
              {user?.name || 'User'}
            </span>
          </button>
          
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="p-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                Profile
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                Settings
              </button>
              <hr className="my-2 border-gray-200 dark:border-gray-600" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};