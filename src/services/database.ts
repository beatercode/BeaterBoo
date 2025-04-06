import { v4 as uuidv4 } from "uuid";
import { TabooCard, WordSet } from "../types/game";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

// Inizializza fingerprintJS per l'identificazione del dispositivo
const fpPromise = FingerprintJS.load();

// Set di parole mockati per fallback in caso di errori API
const mockWordSets: WordSet[] = [
  {
    id: "1",
    name: "Set Base",
    description: "Il set di parole classico del gioco Taboo",
    cards: [
      {
        id: "1",
        mainWord: "Calcio",
        tabooWords: ["Pallone", "Goal", "Campo", "Squadra", "Giocatore"]
      },
      {
        id: "2",
        mainWord: "Pizza",
        tabooWords: ["Formaggio", "Pomodoro", "Italia", "Forno", "Margherita"]
      },
      {
        id: "3",
        mainWord: "Venezia",
        tabooWords: ["Canale", "Gondola", "Italia", "Acqua", "Carnevale"]
      }
    ],
    isCustom: false,
    createdAt: "2024-01-01"
  }
];

// Ottenere l'ID del dispositivo in modo univoco
async function getDeviceId(): Promise<string> {
  try {
    const fp = await fpPromise;
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error("Errore nell'ottenere l'ID del dispositivo:", error);
    // In caso di errore, genera un ID casuale
    return `device_${uuidv4()}`;
  }
}

// Chiamata API generica
async function apiCall<T>(
  endpoint: string,
  method: string = "GET",
  data?: any
): Promise<T> {
  // Codice originale per ambiente di produzione
  const deviceId = await getDeviceId();

  try {
    let url;
    
    // In ambiente build, usa l'URL di produzione
    const baseUrl = import.meta.env.PROD ? 'https://beaterboo.vercel.app' : '';
    
    if (endpoint === 'wordsets') {
      url = `${baseUrl}/api/wordsets`;
    } else if (endpoint.match(/wordsets\/(.+)\/permissions/)) {
      const setId = endpoint.split('/')[1];
      url = `${baseUrl}/api/wordsets?id=${setId}&permissions=true`;
    } else if (endpoint.match(/wordsets\/(.+)/)) {
      const setId = endpoint.split('/')[1];
      url = `${baseUrl}/api/wordsets?id=${setId}`;
    } else {
      url = `${baseUrl}/api/${endpoint}`;
    }
    
    console.log(`Chiamata API a ${url}, metodo: ${method}`);
    
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Device-ID": deviceId
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new Error(`Errore API: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Errore nella chiamata API a ${endpoint}:`, error);
    throw error;
  }
}

// Salvare un nuovo set di parole
async function saveWordSet(wordSet: WordSet): Promise<WordSet> {
  try {
    // Assicurati che il set abbia un ID
    const uuid = wordSet.id || uuidv4();
    const updatedWordSet = {
      ...wordSet,
      id: uuid,
      createdAt: wordSet.createdAt || new Date().toISOString()
    };

    // Chiamata API per salvare il set di parole
    const result = await apiCall<WordSet>(
      "wordsets",
      wordSet.id ? "PUT" : "POST",
      updatedWordSet
    );
    return result;
  } catch (error) {
    console.error("Errore nel salvataggio del set:", error);
    // In caso di errore, restituisce il set originale con un messaggio di avviso
    console.warn("Utilizzando fallback locale per il salvataggio");
    return {
      ...wordSet,
      id: wordSet.id || uuidv4(),
      createdAt: wordSet.createdAt || new Date().toISOString()
    };
  }
}

// Caricare tutti i set di parole
async function loadWordSets(): Promise<WordSet[]> {
  try {
    // Chiamata API per ottenere tutti i set di parole
    const sets = await apiCall<WordSet[]>("wordsets");
    
    // Mostra gli ID dei set per debug
    console.log("Set di parole caricati:", sets.map(set => ({
      id: set.id,
      name: set.name,
      isCustom: set.isCustom,
      creatorDeviceId: set.creatorDeviceId
    })));
    
    return sets;
  } catch (error) {
    console.error("Errore nel caricamento dei set:", error);
    // In caso di errore, restituiamo i set mockati
    console.warn("Utilizzando set di parole mock come fallback");
    return mockWordSets;
  }
}

// Modifico canDeleteWordSet per usare sempre l'API reale
async function canDeleteWordSet(setId: string): Promise<boolean> {
  try {
    // Nel caso di un set appena creato in locale (che non ha ancora un ID numerico),
    // consideriamo l'utente come proprietario
    if (!setId.match(/^\d+$/)) {
      console.log(`Set con ID non numerico (${setId}), l'utente è considerato proprietario`);
      return true;
    }

    // Chiamata API per verificare i permessi
    const result = await apiCall<{ canDelete: boolean }>(
      `wordsets/${setId}/permissions`
    );
    return result.canDelete;
  } catch (error) {
    console.error("Errore nella verifica dei permessi:", error);
    
    // In caso di errore, se siamo in locale, permettiamo l'eliminazione
    // Questo permette di eliminare i set quando non c'è connessione al backend
    if (!import.meta.env.PROD) {
      console.warn("Permettendo l'eliminazione in modalità sviluppo nonostante l'errore");
      return true;
    }
    
    // In caso di errore in produzione, non permettiamo l'eliminazione
    return false;
  }
}

// Modifico deleteWordSet per usare sempre l'API reale
async function deleteWordSet(setId: string): Promise<boolean> {
  try {
    // Prima verifica se può essere eliminato
    if (!await canDeleteWordSet(setId)) {
      console.error("Non hai i permessi per eliminare questo set");
      return false;
    }

    // Chiamata API per eliminare il set
    await apiCall<void>(`wordsets/${setId}`, "DELETE");
    return true;
  } catch (error) {
    console.error("Errore nell'eliminazione del set:", error);
    return false;
  }
}

export {
  getDeviceId,
  saveWordSet,
  loadWordSets,
  canDeleteWordSet,
  deleteWordSet
};
