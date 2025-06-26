import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, DollarSign, Download, Share2, Save, PlusCircle, MessageCircle } from 'lucide-react';
import { MapView } from '../Maps/MapView';
import { useTripStore } from '../../stores/tripStore';
import { useUIStore } from '../../stores/uiStore';
import { travelDataService } from '../../services/travelDataService';
import { pdfService } from '../../services/pdfService';
import { Trip, Location } from '../../types';

export const TripPlanner: React.FC = () => {
  const { currentTrip, updateTrip, isLoading, createTrip } = useTripStore();
  const { setCurrentView } = useUIStore();
  const [locations, setLocations] = useState<Location[]>([]);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [safetyData, setSafetyData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'map' | 'safety'>('overview');

  useEffect(() => {
    if (currentTrip?.destination) {
      loadTripData();
    }
  }, [currentTrip]);

  const loadTripData = async () => {
    if (!currentTrip?.destination) return;

    try {
      // Load weather data
      const weather = await travelDataService.getWeatherForecast(currentTrip.destination);
      setWeatherData(weather);

      // Load safety data
      const safety = await travelDataService.getSafetyData(currentTrip.destination);
      setSafetyData(safety);

      // Extract locations from itinerary
      const tripLocations: Location[] = [];
      currentTrip.itinerary?.forEach(day => {
        day.activities?.forEach(activity => {
          if (activity.location) {
            tripLocations.push(activity.location);
          }
        });
      });
      setLocations(tripLocations);
    } catch (error) {
      console.error('Failed to load trip data:', error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentTrip) return;

    try {
      await pdfService.downloadTripPDF(currentTrip);
    } catch (error) {
      console.error('PDF download failed:', error);
    }
  };

  const handleShareTrip = async () => {
    if (!currentTrip) return;

    const shareUrl = `${window.location.origin}/trip/${currentTrip.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentTrip.title,
          text: `Check out my trip to ${currentTrip.destination}!`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert('Trip link copied to clipboard!');
    }
  };

  const handleSaveTrip = async () => {
    if (!currentTrip) return;

    try {
      await updateTrip(currentTrip.id, {
        ...currentTrip,
        updatedAt: new Date().toISOString()
      });
      alert('Trip saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleCreateNewTrip = async () => {
    try {
      const newTrip = await createTrip({
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

  const handleStartChatting = () => {
    setCurrentView('chat');
  };

  // Empty state when no trip is selected
  if (!currentTrip) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            No Trip Selected
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Create a new trip or select an existing one to start planning your adventure with our AI assistant.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleCreateNewTrip}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <PlusCircle className="w-5 h-5" />
              <span>{isLoading ? 'Creating...' : 'Create New Trip'}</span>
            </button>
            
            <button
              onClick={handleStartChatting}
              className="w-full flex items-center justify-center space-x-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Start Planning with AI</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 truncate">
                {currentTrip.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 truncate">
                {currentTrip.destination || 'Destination not set'}
              </p>
            </div>
            
            <div className="flex items-center space-x-3 flex-shrink-0">
              <button
                onClick={handleSaveTrip}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </button>
              
              <button
                onClick={handleDownloadPDF}
                className="flex items-center space-x-2 bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              
              <button
                onClick={handleShareTrip}
                className="flex items-center space-x-2 bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>

          {/* Trip Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 min-w-0">
              <Calendar className="w-5 h-5 text-primary-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {currentTrip.startDate && currentTrip.endDate
                    ? `${new Date(currentTrip.startDate).toLocaleDateString()} - ${new Date(currentTrip.endDate).toLocaleDateString()}`
                    : 'Dates TBD'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 min-w-0">
              <Users className="w-5 h-5 text-secondary-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">Travelers</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {currentTrip.travelers}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 min-w-0">
              <DollarSign className="w-5 h-5 text-accent-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">Budget</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  ${currentTrip.budget.toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 min-w-0">
              <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                  {currentTrip.status}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'itinerary', label: 'Itinerary' },
                { id: 'map', label: 'Map' },
                { id: 'safety', label: 'Safety' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Weather */}
                {weatherData && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Weather Forecast
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Current</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {weatherData.current.temperature}°C - {weatherData.current.condition}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Humidity</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {weatherData.current.humidity}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trip Preferences */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Trip Preferences
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Budget Level</p>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {currentTrip.preferences.budget}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Travel Style</p>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {currentTrip.preferences.travelStyle}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Accommodation</p>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {currentTrip.preferences.accommodationType}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'itinerary' && (
              <div className="space-y-6" id="itinerary-content">
                {currentTrip.itinerary && currentTrip.itinerary.length > 0 ? (
                  currentTrip.itinerary.map((day, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Day {day.day} - {day.date}
                      </h3>
                      
                      {day.activities && day.activities.length > 0 && (
                        <div className="space-y-3">
                          {day.activities.map((activity, actIndex) => (
                            <div key={actIndex} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="text-sm font-medium text-primary-600 dark:text-primary-400 min-w-0 flex-shrink-0">
                                {activity.timeSlot}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {activity.name}
                                </h4>
                                {activity.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {activity.description}
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span>${activity.cost}</span>
                                  <span>{activity.duration} min</span>
                                  {activity.rating && <span>★ {activity.rating}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No itinerary yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Start chatting with our AI to generate your personalized itinerary
                    </p>
                    <button
                      onClick={handleStartChatting}
                      className="inline-flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Start Planning</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'map' && (
              <div className="min-h-96">
                <MapView
                  trip={currentTrip}
                  locations={locations}
                  showSafetyAlerts={true}
                />
              </div>
            )}

            {activeTab === 'safety' && (
              <div className="space-y-6">
                {safetyData ? (
                  <>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Safety Level: {safetyData.safetyLevel}/10
                      </h3>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${safetyData.safetyLevel * 10}%` }}
                        ></div>
                      </div>
                    </div>

                    {safetyData.recommendations && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                          Safety Recommendations
                        </h3>
                        <ul className="space-y-2">
                          {safetyData.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-blue-500 mt-1 flex-shrink-0">•</span>
                              <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {safetyData.alerts && safetyData.alerts.length > 0 && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                          Recent Safety Alerts
                        </h3>
                        <div className="space-y-3">
                          {safetyData.alerts.map((alert: any, index: number) => (
                            <div key={index} className="border-l-4 border-yellow-400 pl-4">
                              <p className="font-medium text-gray-900 dark:text-white capitalize">
                                {alert.type}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {alert.description}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {alert.location}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading safety information...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};