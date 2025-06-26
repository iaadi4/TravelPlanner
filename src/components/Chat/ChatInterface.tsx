import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MapPin, Calendar, Users, DollarSign, Sparkles } from 'lucide-react';
import { useTripStore } from '../../stores/tripStore';
import { geminiService } from '../../services/geminiService';
import { travelDataService } from '../../services/travelDataService';
import { ChatMessage } from '../../types';

export const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { chatMessages, addChatMessage, currentTrip, updateTrip, isLoading } = useTripStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    // Initialize chat with welcome message
    if (chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm your AI travel assistant powered by advanced AI. I'll help you plan the perfect trip with real-time data and personalized recommendations. Let's start by telling me where you'd like to go and when you're planning to travel.",
        timestamp: new Date().toISOString(),
        type: 'text',
      };
      addChatMessage(welcomeMessage);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    addChatMessage(userMessage);
    const userInput = input;
    setInput('');
    setIsTyping(true);

    try {
      // Build context from current trip and chat history
      const context = {
        currentTrip,
        chatHistory: chatMessages.slice(-5), // Last 5 messages for context
        userPreferences: currentTrip?.preferences
      };

      // Generate AI response using Gemini
      const aiResponse = await geminiService.generateTravelResponse(userInput, context);
      
      // Check if we need to fetch real-time data
      await handleDataFetching(userInput, aiResponse);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      addChatMessage(assistantMessage);

      // Check if we should generate an itinerary
      if (shouldGenerateItinerary(userInput, aiResponse)) {
        await generateItinerary();
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting to my AI services right now. Let me provide you with some general travel advice instead. Could you tell me more about your destination and travel preferences?",
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      addChatMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDataFetching = async (userInput: string, aiResponse: string) => {
    const lowerInput = userInput.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();

    // Check if user is asking about flights
    if (lowerInput.includes('flight') || lowerInput.includes('plane') || lowerResponse.includes('flight')) {
      await fetchFlightData();
    }

    // Check if user is asking about hotels
    if (lowerInput.includes('hotel') || lowerInput.includes('accommodation') || lowerResponse.includes('hotel')) {
      await fetchHotelData();
    }

    // Check if user is asking about restaurants
    if (lowerInput.includes('restaurant') || lowerInput.includes('food') || lowerResponse.includes('restaurant')) {
      await fetchRestaurantData();
    }

    // Check if user is asking about weather
    if (lowerInput.includes('weather') || lowerInput.includes('climate') || lowerResponse.includes('weather')) {
      await fetchWeatherData();
    }
  };

  const fetchFlightData = async () => {
    if (!currentTrip?.destination) return;

    try {
      const flights = await travelDataService.searchFlights(
        'NYC', // This would be determined from user location
        currentTrip.destination.split(',')[0].substring(0, 3).toUpperCase(),
        currentTrip.startDate || new Date().toISOString().split('T')[0]
      );

      if (flights.length > 0) {
        const flightMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I found some flight options for you:\n\n${flights.slice(0, 3).map(flight => 
            `✈️ ${flight.airline} - $${flight.price} ${flight.currency}\nDeparture: ${new Date(flight.departure.at).toLocaleString()}\nArrival: ${new Date(flight.arrival.at).toLocaleString()}`
          ).join('\n\n')}`,
          timestamp: new Date().toISOString(),
          type: 'text',
        };

        addChatMessage(flightMessage);
      }
    } catch (error) {
      console.error('Flight data fetch error:', error);
    }
  };

  const fetchHotelData = async () => {
    if (!currentTrip?.destination) return;

    try {
      const hotels = await travelDataService.searchHotels(
        currentTrip.destination.split(',')[0].substring(0, 3).toUpperCase(),
        currentTrip.startDate || new Date().toISOString().split('T')[0],
        currentTrip.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );

      if (hotels.length > 0) {
        const hotelMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Here are some accommodation options:\n\n${hotels.slice(0, 3).map(hotel => 
            `🏨 ${hotel.name} (${hotel.rating}⭐)\n$${hotel.price} ${hotel.currency} per night\n${hotel.location.address}\nAmenities: ${hotel.amenities.join(', ')}`
          ).join('\n\n')}`,
          timestamp: new Date().toISOString(),
          type: 'text',
        };

        addChatMessage(hotelMessage);
      }
    } catch (error) {
      console.error('Hotel data fetch error:', error);
    }
  };

  const fetchRestaurantData = async () => {
    if (!currentTrip?.destination) return;

    try {
      const restaurants = await travelDataService.getRestaurants(currentTrip.destination);

      if (restaurants.length > 0) {
        const restaurantMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I found some great dining options:\n\n${restaurants.slice(0, 3).map(restaurant => 
            `🍽️ ${restaurant.name}\n${restaurant.category} • ${'$'.repeat(restaurant.price)} • ${restaurant.rating}⭐\n${restaurant.location.address}`
          ).join('\n\n')}`,
          timestamp: new Date().toISOString(),
          type: 'text',
        };

        addChatMessage(restaurantMessage);
      }
    } catch (error) {
      console.error('Restaurant data fetch error:', error);
    }
  };

  const fetchWeatherData = async () => {
    if (!currentTrip?.destination) return;

    try {
      const weather = await travelDataService.getWeatherForecast(currentTrip.destination);

      const weatherMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Here's the weather forecast for ${currentTrip.destination}:\n\n🌤️ Current: ${weather.current.temperature}°C, ${weather.current.condition}\n💧 Humidity: ${weather.current.humidity}%\n💨 Wind: ${weather.current.windSpeed} km/h\n\nUpcoming days:\n${weather.forecast.slice(0, 3).map(day => 
          `${new Date(day.date).toLocaleDateString()}: ${day.temperature}°C, ${day.condition}`
        ).join('\n')}`,
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      addChatMessage(weatherMessage);
    } catch (error) {
      console.error('Weather data fetch error:', error);
    }
  };

  const shouldGenerateItinerary = (userInput: string, aiResponse: string): boolean => {
    const triggers = ['itinerary', 'schedule', 'plan my trip', 'day by day', 'generate plan'];
    const combined = (userInput + ' ' + aiResponse).toLowerCase();
    return triggers.some(trigger => combined.includes(trigger));
  };

  const generateItinerary = async () => {
    if (!currentTrip) return;

    try {
      setIsTyping(true);
      
      const itineraryMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Let me generate a detailed itinerary for your trip. This will take a moment as I gather the best recommendations and real-time information...",
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      addChatMessage(itineraryMessage);

      const itinerary = await geminiService.generateItinerary({
        destination: currentTrip.destination,
        duration: currentTrip.endDate && currentTrip.startDate 
          ? Math.ceil((new Date(currentTrip.endDate).getTime() - new Date(currentTrip.startDate).getTime()) / (1000 * 60 * 60 * 24))
          : 7,
        budget: currentTrip.budget,
        travelers: currentTrip.travelers,
        interests: currentTrip.preferences.interests,
        travelStyle: currentTrip.preferences.travelStyle
      });

      // Update trip with generated itinerary
      if (itinerary.days) {
        await updateTrip(currentTrip.id, {
          itinerary: itinerary.days
        });

        const successMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Perfect! I've generated your personalized itinerary with real-time data. You can view it in the Trip Planner section. The itinerary includes:\n\n✅ Daily activities with timings\n✅ Restaurant recommendations\n✅ Transportation options\n✅ Cost estimates\n✅ Safety tips\n✅ Weather considerations\n\nWould you like me to adjust anything or add specific activities?",
          timestamp: new Date().toISOString(),
          type: 'text',
        };

        addChatMessage(successMessage);
      }
    } catch (error) {
      console.error('Itinerary generation error:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I encountered an issue generating your itinerary. Let me help you plan it step by step instead. What type of activities are you most interested in?",
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      addChatMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary-500" />
              <span>AI Travel Assistant</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentTrip ? `Planning: ${currentTrip.title}` : 'Powered by Gemini AI • Real-time data • Personalized recommendations'}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>AI Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
              <p className={`text-xs mt-2 ${
                message.role === 'user' 
                  ? 'text-primary-100' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Trip Summary Sidebar */}
      {currentTrip && (
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Current Trip
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {currentTrip.destination || 'Not set'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {currentTrip.startDate || 'Not set'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {currentTrip.travelers} travelers
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                ${currentTrip.budget || 0} budget
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about flights, hotels, restaurants, weather, or anything about your trip..."
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading || isTyping}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-600 text-white p-3 rounded-lg transition-all duration-200 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
          >
            {isLoading || isTyping ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line • Powered by Gemini AI with real-time data
        </p>
      </div>
    </div>
  );
};