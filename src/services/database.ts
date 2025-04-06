import { v4 as uuidv4 } from "uuid";
import { TabooCard, WordSet } from "../types/game";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

// Inizializza fingerprintJS per l'identificazione del dispositivo
const fpPromise = FingerprintJS.load();

// Endpoint API per le operazioni sul database
// Durante lo sviluppo usa l'API locale, altrimenti usa l'API remota
const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:3001/api"
  : "/api";

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
  const deviceId = await getDeviceId();

  try {
    let url = `${API_BASE_URL}/wordsets`;
    
    // Costruisci l'URL in base al tipo di endpoint
    if (endpoint === 'wordsets') {
      // URL base già impostato
    } else if (endpoint.match(/wordsets\/(.+)\/permissions/)) {
      // Handling per la verifica dei permessi - formato: api/wordsets?id=XXX&permissions=true
      const setId = endpoint.split('/')[1];
      url = `${API_BASE_URL}/wordsets?id=${setId}&permissions=true`;
    } else if (endpoint.match(/wordsets\/(.+)/)) {
      // Handling per le operazioni su un set specifico - formato: api/wordsets?id=XXX
      const setId = endpoint.split('/')[1];
      url = `${API_BASE_URL}/wordsets?id=${setId}`;
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
    return sets;
  } catch (error) {
    console.error("Errore nel caricamento dei set:", error);
    // In caso di errore, restituiamo i set mockati
    console.warn("Utilizzando set di parole mock come fallback");
    return mockWordSets;
  }
}

// Verificare se l'utente può eliminare un set
async function canDeleteWordSet(setId: string): Promise<boolean> {
  try {
    // Chiamata API per verificare i permessi
    const result = await apiCall<{ canDelete: boolean }>(
      `wordsets/${setId}/permissions`
    );
    return result.canDelete;
  } catch (error) {
    console.error("Errore nella verifica dei permessi:", error);
    // In modalità sviluppo o errore, permettiamo sempre l'eliminazione
    return import.meta.env.DEV === true || setId === "1";
  }
}

// Eliminare un set di parole
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
    // In modalità sviluppo, simuliamo successo
    return import.meta.env.DEV;
  }
}

export {
  getDeviceId,
  saveWordSet,
  loadWordSets,
  canDeleteWordSet,
  deleteWordSet
};
