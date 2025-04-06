import { TabooCard } from '../types/game';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Generative AI API with your API key
const API_KEY = 'AIzaSyD0NIUoBAXMBPuXETU4WHWVhFNxlr9g4gY';
const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateTabooWords(topic: string): Promise<TabooCard[]> {
  try {
    // Create a prompt for generating Taboo game cards
    const prompt = `Generate 50 Taboo game cards in Italian. Each card should have:
    1. A main word to guess
    2. 5 taboo words that can't be used
    The words should be ${topic ? `related to ${topic}` : 'from various categories'}.
    Format the response as a JSON array with this structure:
    [{"mainWord": "word", "tabooWords": ["word1", "word2", "word3", "word4", "word5"]}]`;

    // Access the generative model - using the correct model name for the current API version
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract the JSON array from the response text
    const jsonMatch = text.match(/\[.*\]/s);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    // Parse the JSON array
    const cards: Array<Omit<TabooCard, 'id'>> = JSON.parse(jsonMatch[0]);
    
    // Add IDs to the cards
    return cards.map(card => ({
      ...card,
      id: Math.random().toString(36).substr(2, 9)
    }));

  } catch (error) {
    console.error('Error generating words:', error);
    throw error;
  }
}
