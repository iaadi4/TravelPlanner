import React, { useEffect } from 'react';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock,
  Star,
  Globe,
  BarChart3,
  PlusCircle
} from 'lucide-react';
import { useTripStore } from '../../stores/tripStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { format } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { trips, loadTrips, isLoading, createTrip, setCurrentTrip } = useTripStore();
  const { user } = useAuthStore();
  const { setCurrentView } = useUIStore();

  useEffect(() => {
    loadTrips();
  }, []);

  const handleCreateTrip = async () => {
    try {
      const newTrip = await createTrip({
        title: 'New Trip',
        destination: '',
        startDate: '',
        endDate: '',
        budget: 0,
        travelers: 1,
      });
      setCurrentTrip(newTrip);
      setCurrentView('chat');
    } catch (error) {
      console.error('Failed to create trip:', error);
    }
  };

  const handleTripClick = (trip: any) => {
    setCurrentTrip(trip);
    setCurrentView('trip');
  };

  const totalBudget = trips.reduce((sum, trip) => sum + trip.budget, 0);
  const completedTrips = trips.filter(trip => trip.status === 'completed').length;
  const upcomingTrips = trips.filter(trip => trip.status === 'planning').length;

  const stats = [
    {
      label: 'Total Trips',
      value: trips.length,
      icon: MapPin,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
    },
    {
      label: 'Total Budget',
      value: `$${totalBudget.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50 dark:bg-secondary-900/20',
    },
    {
      label: 'Completed',
      value: completedTrips,
      icon: Star,
      color: 'text-accent-600',
      bgColor: 'bg-accent-50 dark:bg-accent-900/20',
    },
    {
      label: 'Upcoming',
      value: upcomingTrips,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's your travel overview and recent activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Trips
              </h2>
              <button
                onClick={handleCreateTrip}
                className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Trip</span>
              </button>
            </div>

            {trips.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No trips yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Start planning your first adventure with our AI assistant
                </p>
                <button
                  onClick={handleCreateTrip}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Plan Your First Trip
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {trips.slice(0, 3).map((trip) => (
                  <div
                    key={trip.id}
                    onClick={() => handleTripClick(trip)}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary-400 to-accent-400 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {trip.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {trip.destination}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {trip.startDate ? format(new Date(trip.startDate), 'MMM dd') : 'Date TBD'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {trip.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Plan Status */}
          <div className="bg-gradient-to-r from-accent-500 to-primary-500 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {user?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </h3>
              <Star className="w-6 h-6" />
            </div>
            <p className="text-accent-100 mb-4">
              {user?.plan === 'pro' 
                ? 'Unlimited trips and premium features'
                : 'Limited to 3 trips per month'
              }
            </p>
            {user?.plan === 'free' && (
              <button
                onClick={() => setCurrentView('pricing')}
                className="w-full bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Upgrade to Pro
              </button>
            )}
          </div>

          {/* Travel Insights */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Travel Insights
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Average trip budget
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${trips.length > 0 ? Math.round(totalBudget / trips.length) : 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Most visited
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Europe
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Travel style
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Comfort
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};