import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async generateTravelResponse(userMessage: string, context: any = {}) {
    try {
      const prompt = this.buildTravelPrompt(userMessage, context);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateItinerary(tripData: any) {
    try {
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
      throw new Error('Failed to generate itinerary');
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
      throw new Error('Failed to analyze travel safety');
    }
  }
}

export const geminiService = new GeminiService();