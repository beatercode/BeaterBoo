import { TabooCard } from '../types/game';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Generative AI API with your API key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyD0NIUoBAXMBPuXETU4WHWVhFNxlr9g4gY';
const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-pro';
const genAI = new GoogleGenerativeAI(API_KEY);

// Set di parole mockate per fallback in caso di errori API
const mockWordSets: Omit<TabooCard, 'id'>[] = [
  { mainWord: "Calcio", tabooWords: ["Pallone", "Goal", "Campo", "Squadra", "Giocatore"] },
  { mainWord: "Pizza", tabooWords: ["Formaggio", "Pomodoro", "Italia", "Forno", "Margherita"] },
  { mainWord: "Luna", tabooWords: ["Notte", "Stella", "Cielo", "Spazio", "Terra"] },
  { mainWord: "Telefono", tabooWords: ["Chiamata", "App", "Mobile", "Touchscreen", "Internet"] },
  { mainWord: "Aereo", tabooWords: ["Volare", "Pilota", "Cielo", "Ala", "Viaggio"] },
  { mainWord: "Computer", tabooWords: ["Internet", "Tastiera", "Mouse", "Schermo", "Digital"] },
  { mainWord: "Mare", tabooWords: ["Acqua", "Sabbia", "Pesce", "Onda", "Nuotare"] },
  { mainWord: "Cinema", tabooWords: ["Film", "Attore", "Popcorn", "Schermo", "Regista"] },
  { mainWord: "Libro", tabooWords: ["Leggere", "Pagina", "Autore", "Storia", "Copertina"] },
  { mainWord: "Gelato", tabooWords: ["Freddo", "Cono", "Dolce", "Estate", "Cioccolato"] }
];

export async function generateTabooWords(
  topic: string,
  category: string = '',
  count: number = 30, 
  existingWords: string[] = []
): Promise<TabooCard[]> {
  try {
    // Create a prompt for generating Taboo game cards
    const prompt = `Generate ${count} Taboo game cards in Italian. Each card should have:
    1. A main word to guess
    2. 5 taboo words that can't be used
    ${topic ? `The words should be related to ${topic}.` : 'The words should be from various categories.'}
    ${category ? `The difficulty level should be ${category}.` : ''}
    ${existingWords.length > 0 ? `IMPORTANT: DO NOT include any of these words as main words: ${existingWords.join(', ')}` : ''}
    Format the response as a valid JSON array with this structure:
    [{"mainWord": "word", "tabooWords": ["word1", "word2", "word3", "word4", "word5"]}, ...]
    
    Every mainWord must be unique and none should match any in the existing list.
    Make sure each mainWord is a single word, not a phrase.
    All words must be in Italian.
    IMPORTANT: Ensure the JSON is properly formatted with no trailing commas.`;

    // Access the generative model - using the model name from environment variables
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Tenta di estrarre un JSON valido dalla risposta
    try {
      // Prima cerca il pattern di un array JSON nella risposta
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      let jsonText = jsonMatch[0];
      
      // Rimuovi caratteri non validi in JSON che potrebbero causare problemi
      jsonText = jsonText
        // Rimuovi eventuali backtick (`) comuni nell'output di markdown
        .replace(/```json|```/g, '')
        // Correggi virgole finali che precedono un chiusura di array
        .replace(/,(\s*[\]}])/g, '$1')
        // Rimuovi spazi eccessivi
        .trim();
      
      // Verifica che il testo inizi con [ e finisca con ]
      if (!jsonText.startsWith('[') || !jsonText.endsWith(']')) {
        throw new Error('Invalid JSON array format');
      }
      
      // Parsa il JSON
      const cards: Array<Omit<TabooCard, 'id'>> = JSON.parse(jsonText);
      
      // Verifica che ogni card abbia i campi necessari
      if (!cards.every(card => 
        typeof card.mainWord === 'string' && 
        Array.isArray(card.tabooWords) && 
        card.tabooWords.length > 0
      )) {
        throw new Error('Invalid card format in response');
      }
      
      // Add IDs to the cards
      return cards.map(card => ({
        ...card,
        id: Math.random().toString(36).substr(2, 9)
      }));
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, 'Response was:', text);
      
      // In caso di errore, usa le parole di fallback
      console.warn('Utilizzando parole di fallback a causa di errori di parsing');
      
      // Filtra le parole già esistenti
      const filteredMocks = mockWordSets.filter(card => 
        !existingWords.includes(card.mainWord)
      );
      
      // Genera carte fino al numero richiesto, ricliclando se necessario
      const result: TabooCard[] = [];
      for (let i = 0; i < Math.min(count, 30); i++) {
        const baseCard = filteredMocks[i % filteredMocks.length];
        const suffix = Math.floor(i / filteredMocks.length) > 0 
          ? ` ${Math.floor(i / filteredMocks.length) + 1}` 
          : '';
        
        result.push({
          id: Math.random().toString(36).substr(2, 9),
          mainWord: topic ? `${topic} ${i+1}` : baseCard.mainWord + suffix,
          tabooWords: [...baseCard.tabooWords]
        });
      }
      
      return result;
    }
  } catch (error) {
    console.error('Error generating words:', error);
    
    // In caso di errori generici, usa il fallback
    console.warn('Utilizzando parole di fallback a causa di errori nella generazione');
    
    // Genera carte fallback come sopra
    const result: TabooCard[] = [];
    for (let i = 0; i < Math.min(count, 30); i++) {
      const baseCard = mockWordSets[i % mockWordSets.length];
      
      result.push({
        id: Math.random().toString(36).substr(2, 9),
        mainWord: topic ? `${topic} ${i+1}` : baseCard.mainWord + (i > 9 ? ` ${Math.floor(i/10) + 1}` : ''),
        tabooWords: [...baseCard.tabooWords]
      });
    }
    
    return result;
  }
}
