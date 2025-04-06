import { v4 as uuidv4 } from 'uuid';
import { TabooCard, WordSet } from '../types/game';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Inizializza fingerprintJS per l'identificazione del dispositivo
const fpPromise = FingerprintJS.load();

// Verifica se siamo in un ambiente browser
const isBrowser = typeof window !== 'undefined';

// Flag per indicare se usare localStorage come fallback
let useLocalStorageFallback = isBrowser;

// Chiavi per localStorage
const DEVICE_ID_KEY = 'beaterboo_device_id';
const WORD_SETS_KEY = 'beaterboo_word_sets';

// Configurazione del pool di connessioni PostgreSQL - sarà inizializzato solo se necessario
let pool: any = null;

// Inizializza il pool solo quando necessario e possibile
const initPool = async () => {
  if (!isBrowser && !pool) {
    try {
      const { Pool } = await import('pg');
      pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_jgcz7wBDkAE8@ep-weathered-bar-a5p9x10j-pooler.us-east-2.aws.neon.tech/beaterboo',
        ssl: {
          rejectUnauthorized: false
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      
      // Test della connessione
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      useLocalStorageFallback = false;
      console.log('Database connesso con successo');
    } catch (error) {
      console.error('Errore nella connessione al database, utilizzo localStorage come fallback:', error);
      useLocalStorageFallback = true;
    }
  }
};

// Ottenere l'ID del dispositivo in modo univoco
async function getDeviceId(): Promise<string> {
  try {
    const fp = await fpPromise;
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error('Errore nell\'ottenere l\'ID del dispositivo:', error);
    // Fallback: genera un ID casuale e lo salva in localStorage
    if (isBrowser) {
      let deviceId = localStorage.getItem(DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = `device_${uuidv4()}`;
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
      }
      return deviceId;
    }
    return `device_${uuidv4()}`;
  }
}

// Salva i set nel localStorage
function saveToLocalStorage(sets: WordSet[]) {
  if (isBrowser) {
    localStorage.setItem(WORD_SETS_KEY, JSON.stringify(sets));
  }
}

// Carica i set dal localStorage
function loadFromLocalStorage(): WordSet[] {
  if (isBrowser) {
    const data = localStorage.getItem(WORD_SETS_KEY);
    return data ? JSON.parse(data) : [];
  }
  return [];
}

// Salvare un nuovo set di parole
async function saveWordSet(wordSet: WordSet): Promise<WordSet> {
  try {
    await initPool();
    const deviceId = await getDeviceId();
    
    // Assicurati che il set abbia un ID
    const uuid = wordSet.id || uuidv4();
    const updatedWordSet = {
      ...wordSet,
      id: uuid,
      createdAt: wordSet.createdAt || new Date().toISOString()
    };
    
    if (useLocalStorageFallback) {
      // Salvataggio in localStorage
      const existingSets = loadFromLocalStorage();
      const setIndex = existingSets.findIndex(set => set.id === uuid);
      
      if (setIndex !== -1) {
        existingSets[setIndex] = updatedWordSet;
      } else {
        existingSets.unshift(updatedWordSet);
      }
      
      saveToLocalStorage(existingSets);
      return updatedWordSet;
    }
    
    // Altrimenti salva nel database
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Registra o aggiorna il dispositivo
      await client.query(`
        INSERT INTO devices (device_id, last_seen)
        VALUES ($1, CURRENT_TIMESTAMP)
        ON CONFLICT (device_id) 
        DO UPDATE SET last_seen = CURRENT_TIMESTAMP
      `, [deviceId]);
      
      // Inserisci il set
      await client.query(`
        INSERT INTO word_sets (uuid, name, description, is_custom, created_at, device_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (uuid) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          description = EXCLUDED.description
      `, [uuid, updatedWordSet.name, updatedWordSet.description, updatedWordSet.isCustom, new Date(updatedWordSet.createdAt), deviceId]);
      
      // Se ci sono carte, inseriscile
      if (updatedWordSet.cards && updatedWordSet.cards.length > 0) {
        // Prima elimina eventuali carte esistenti (in caso di aggiornamento)
        await client.query('DELETE FROM taboo_cards WHERE set_uuid = $1', [uuid]);
        
        // Poi inserisci le nuove carte
        for (const card of updatedWordSet.cards) {
          await client.query(`
            INSERT INTO taboo_cards (set_uuid, main_word, taboo_words)
            VALUES ($1, $2, $3)
          `, [uuid, card.mainWord, card.tabooWords]);
        }
      }
      
      await client.query('COMMIT');
      
      return updatedWordSet;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Errore nel salvataggio nel database, utilizzo localStorage come fallback:', error);
      
      // Fallback su localStorage
      useLocalStorageFallback = true;
      return saveWordSet(updatedWordSet);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Errore generale nel salvataggio:', error);
    
    // Fallback finale
    const uuid = wordSet.id || uuidv4();
    return {
      ...wordSet,
      id: uuid,
      createdAt: wordSet.createdAt || new Date().toISOString()
    };
  }
}

// Caricare tutti i set di parole
async function loadWordSets(): Promise<WordSet[]> {
  try {
    await initPool();
    
    if (useLocalStorageFallback) {
      return loadFromLocalStorage();
    }
    
    const client = await pool.connect();
    
    try {
      // Ottieni tutti i set
      const setsResult = await client.query(`
        SELECT * FROM word_sets
        ORDER BY created_at DESC
      `);
      
      const sets: WordSet[] = [];
      
      // Per ogni set, ottieni le carte
      for (const setRow of setsResult.rows) {
        const cardsResult = await client.query(`
          SELECT * FROM taboo_cards
          WHERE set_uuid = $1
        `, [setRow.uuid]);
        
        const cards: TabooCard[] = cardsResult.rows.map((card: any) => ({
          id: card.id.toString(),
          mainWord: card.main_word,
          tabooWords: card.taboo_words
        }));
        
        sets.push({
          id: setRow.uuid,
          name: setRow.name,
          description: setRow.description,
          isCustom: setRow.is_custom,
          createdAt: setRow.created_at.toISOString(),
          cards,
          creatorDeviceId: setRow.device_id
        });
      }
      
      // Salva anche in localStorage come cache
      if (isBrowser) {
        saveToLocalStorage(sets);
      }
      
      return sets;
    } catch (error) {
      console.error('Errore nel caricamento dei set dal database, utilizzo localStorage come fallback:', error);
      useLocalStorageFallback = true;
      return loadFromLocalStorage();
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Errore generale nel caricamento dei set:', error);
    return loadFromLocalStorage();
  }
}

// Verificare se l'utente può eliminare un set
async function canDeleteWordSet(setId: string): Promise<boolean> {
  try {
    const deviceId = await getDeviceId();
    
    if (useLocalStorageFallback) {
      // In localStorage tutti i set sono eliminabili
      return true;
    }
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 1 FROM word_sets
        WHERE uuid = $1 AND device_id = $2
      `, [setId, deviceId]);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Errore nella verifica dei permessi di eliminazione:', error);
      return false;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Errore generale nella verifica dei permessi:', error);
    return false;
  }
}

// Eliminare un set di parole
async function deleteWordSet(setId: string): Promise<boolean> {
  try {
    await initPool();
    
    if (useLocalStorageFallback) {
      // Eliminazione da localStorage
      const existingSets = loadFromLocalStorage();
      const filteredSets = existingSets.filter(set => set.id !== setId);
      saveToLocalStorage(filteredSets);
      return true;
    }
    
    if (!await canDeleteWordSet(setId)) {
      console.error('Non hai i permessi per eliminare questo set');
      return false;
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Elimina tutte le carte associate al set
      await client.query('DELETE FROM taboo_cards WHERE set_uuid = $1', [setId]);
      
      // Elimina il set
      await client.query('DELETE FROM word_sets WHERE uuid = $1', [setId]);
      
      await client.query('COMMIT');
      
      // Aggiorna anche localStorage
      if (isBrowser) {
        const sets = loadFromLocalStorage();
        saveToLocalStorage(sets.filter(set => set.id !== setId));
      }
      
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Errore nell\'eliminazione del set di parole dal database, utilizzo localStorage:', error);
      
      // Fallback su localStorage
      useLocalStorageFallback = true;
      return deleteWordSet(setId);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Errore generale nell\'eliminazione del set:', error);
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
