import React from 'react';
import { 
  MessageCircle, 
  LayoutDashboard, 
  MapPin, 
  User, 
  CreditCard, 
  Settings,
  PlusCircle,
  Calendar,
  Star,
  TrendingUp
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useTripStore } from '../../stores/tripStore';
import { useAuthStore } from '../../stores/authStore';

const navigationItems = [
  { icon: MessageCircle, label: 'AI Chat', view: 'chat' as const },
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' as const },
  { icon: MapPin, label: 'My Trips', view: 'trip' as const },
  { icon: User, label: 'Profile', view: 'profile' as const },
  { icon: CreditCard, label: 'Pricing', view: 'pricing' as const },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen, currentView, setCurrentView } = useUIStore();
  const { trips, createTrip } = useTripStore();
  const { user } = useAuthStore();

  const handleCreateTrip = async () => {
    try {
      await createTrip({
        title: 'New Trip',
        destination: '',
        startDate: '',
        endDate: '',
        budget: 0,
        travelers: 1,
      });
      setCurrentView('chat');
    } catch (error) {
      console.error('Failed to create trip:', error);
    }
  };

  if (!sidebarOpen) return null;

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleCreateTrip}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white px-4 py-3 rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 transform hover:scale-105"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="font-medium">New Trip</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            
            return (
              <li key={item.view}>
                <button
                  onClick={() => setCurrentView(item.view)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-r-2 border-primary-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Recent Trips */}
      {trips.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Recent Trips
          </h3>
          <div className="space-y-2">
            {trips.slice(0, 3).map((trip) => (
              <div
                key={trip.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-secondary-400 to-primary-400 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {trip.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {trip.destination}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Plan Status */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-gradient-to-r from-accent-500 to-primary-500 rounded-lg p-3 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {user?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
            </span>
            <Star className="w-4 h-4" />
          </div>
          <div className="text-xs opacity-90 mb-2">
            {user?.plan === 'pro' 
              ? 'Unlimited trips and premium features'
              : '3 trips remaining this month'
            }
          </div>
          {user?.plan === 'free' && (
            <button
              onClick={() => setCurrentView('pricing')}
              className="w-full bg-white/20 hover:bg-white/30 text-white text-xs py-2 px-3 rounded-md transition-colors"
            >
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};