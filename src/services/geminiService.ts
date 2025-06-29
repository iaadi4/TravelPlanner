import { GoogleGenerativeAI } from '@google/generative-ai';

// Use a placeholder key if not set to prevent initialization errors
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'placeholder-key';
const genAI = new GoogleGenerativeAI(apiKey);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async generateTravelResponse(userMessage: string, context: any = {}) {
    try {
      // Check if we have a valid API key
      if (apiKey === 'placeholder-key') {
        return this.getMockResponse(userMessage);
      }

      const prompt = this.buildTravelPrompt(userMessage, context);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getMockResponse(userMessage);
    }
  }

  async generateItinerary(tripData: any) {
    try {
      // Check if we have a valid API key
      if (apiKey === 'placeholder-key') {
        return this.getMockItinerary(tripData);
      }

      const prompt = `
        Create a detailed day-by-day travel itinerary for:
        - Destination: ${tripData.destination}
        - Duration: ${tripData.duration} days
        - Budget: $${tripData.budget}
        - Travelers: ${tripData.travelers}
        - Interests: ${tripData.interests?.join(', ')}
        - Travel Style: ${tripData.travelStyle}
        
        Include:
        1. Daily activities with specific times
        2. Restaurant recommendations for each meal
        3. Transportation between locations
        4. Estimated costs for each activity
        5. Safety tips and local customs
        6. Weather considerations
        
        Format as JSON with this structure:
        {
          "days": [
            {
              "day": 1,
              "date": "YYYY-MM-DD",
              "activities": [...],
              "meals": [...],
              "transportation": [...],
              "accommodation": {...},
              "totalCost": 0,
              "tips": [...]
            }
          ]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      try {
        return JSON.parse(text);
      } catch {
        // If JSON parsing fails, return structured text
        return { rawText: text };
      }
    } catch (error) {
      console.error('Itinerary generation error:', error);
      return this.getMockItinerary(tripData);
    }
  }

  private buildTravelPrompt(userMessage: string, context: any) {
    return `
      You are TravelHelperAI, an expert travel planning assistant. 
      
      Context: ${JSON.stringify(context)}
      User Message: ${userMessage}
      
      Provide helpful, personalized travel advice. Ask relevant follow-up questions to better understand their needs.
      Focus on:
      - Budget optimization
      - Safety considerations
      - Local experiences
      - Practical travel tips
      - Real-time considerations (weather, events, etc.)
      
      Keep responses conversational and engaging.
    `;
  }

  async analyzeTravelSafety(destination: string) {
    try {
      if (apiKey === 'placeholder-key') {
        return this.getMockSafetyAnalysis(destination);
      }

      const prompt = `
        Analyze the current safety situation for travelers visiting ${destination}.
        Include:
        1. General safety level (1-10 scale)
        2. Common safety concerns
        3. Areas to avoid
        4. Safety tips for tourists
        5. Emergency contacts and procedures
        6. Current travel advisories
        
        Format as JSON.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Safety analysis error:', error);
      return this.getMockSafetyAnalysis(destination);
    }
  }

  private getMockResponse(userMessage: string): string {
    const responses = [
      `I'd be happy to help you plan your trip! Based on your message about "${userMessage}", I can provide some great recommendations. What specific aspects of your travel would you like to focus on - accommodation, activities, dining, or transportation?`,
      `That sounds like an exciting destination! For the best travel experience, I'd recommend considering your budget, travel dates, and preferred activities. Would you like me to help you create a detailed itinerary?`,
      `Great question! I can help you with detailed travel planning including flights, hotels, local attractions, and safety tips. What's your approximate budget and how many days are you planning to stay?`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getMockItinerary(tripData: any) {
    const startDate = new Date(tripData.startDate || Date.now());
    const days = [];
    
    for (let i = 0; i < tripData.duration; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      days.push({
        day: i + 1,
        date: currentDate.toISOString().split('T')[0],
        activities: [
          {
            name: `Explore ${tripData.destination} - Day ${i + 1}`,
            type: 'attraction',
            description: `Discover the highlights of ${tripData.destination} with guided tours and local experiences.`,
            timeSlot: '09:00-12:00',
            duration: 180,
            cost: Math.floor(Math.random() * 50) + 25,
            rating: 4.5,
            location: {
              name: `${tripData.destination} City Center`,
              address: `Main Street, ${tripData.destination}`,
              lat: 40.7128 + (Math.random() - 0.5) * 0.1,
              lng: -74.0060 + (Math.random() - 0.5) * 0.1
            },
            tips: ['Bring comfortable walking shoes', 'Book tickets in advance']
          },
          {
            name: 'Local Restaurant Experience',
            type: 'meal',
            description: 'Enjoy authentic local cuisine at a highly-rated restaurant.',
            timeSlot: '12:30-14:00',
            duration: 90,
            cost: Math.floor(Math.random() * 40) + 20,
            rating: 4.3,
            location: {
              name: 'Local Bistro',
              address: `Restaurant District, ${tripData.destination}`,
              lat: 40.7128 + (Math.random() - 0.5) * 0.1,
              lng: -74.0060 + (Math.random() - 0.5) * 0.1
            },
            tips: ['Try the local specialty', 'Reservations recommended']
          }
        ],
        budget: Math.floor(tripData.budget / tripData.duration),
        notes: `Day ${i + 1} focuses on exploring the main attractions and experiencing local culture.`
      });
    }

    return {
      days,
      totalCost: tripData.budget,
      tips: [
        'Pack light and bring comfortable shoes',
        'Keep copies of important documents',
        'Learn basic local phrases',
        'Stay hydrated and try local food'
      ],
      safetyNotes: [
        'Be aware of your surroundings',
        'Keep valuables secure',
        'Use official transportation',
        'Have emergency contacts ready'
      ]
    };
  }

  private getMockSafetyAnalysis(destination: string): string {
    return JSON.stringify({
      safetyLevel: 7,
      concerns: ['Pickpocketing in tourist areas', 'Traffic congestion'],
      avoidAreas: ['Late night in certain districts'],
      tips: [
        'Keep valuables secure',
        'Use official transportation',
        'Stay in well-lit areas at night',
        'Have emergency contacts ready'
      ],
      emergencyContacts: {
        police: '911',
        medical: '911',
        embassy: 'Contact local embassy'
      }
    });
  }
}

export const geminiService = new GeminiService();