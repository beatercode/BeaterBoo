import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { TabooCard, WordSet } from '../types/game';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Inizializza fingerprintJS per l'identificazione del dispositivo
const fpPromise = FingerprintJS.load();

// Configurazione del pool di connessioni PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_jgcz7wBDkAE8@ep-weathered-bar-a5p9x10j-pooler.us-east-2.aws.neon.tech/beaterboo',
  ssl: {
    rejectUnauthorized: false // Necessario per alcuni provider
  },
  max: 20, // Massimo numero di client nel pool
  idleTimeoutMillis: 30000, // Quanto tempo un client può rimanere inattivo prima di essere rilasciato
  connectionTimeoutMillis: 2000, // Tempo massimo di attesa per una connessione
});

// Ottenere l'ID del dispositivo in modo univoco
async function getDeviceId(): Promise<string> {
  try {
    const fp = await fpPromise;
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error('Errore nell\'ottenere l\'ID del dispositivo:', error);
    // Fallback: genera un ID casuale e lo salva in localStorage
    let deviceId = localStorage.getItem('beaterboo_device_id');
    if (!deviceId) {
      deviceId = `device_${uuidv4()}`;
      localStorage.setItem('beaterboo_device_id', deviceId);
    }
    return deviceId;
  }
}

// Assicurarsi che le tabelle esistano
async function initDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255) NOT NULL UNIQUE,
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS word_sets (
        id SERIAL PRIMARY KEY,
        uuid VARCHAR(36) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_custom BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        device_id VARCHAR(255) NOT NULL,
        FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS taboo_cards (
        id SERIAL PRIMARY KEY,
        set_uuid VARCHAR(36) NOT NULL,
        main_word VARCHAR(255) NOT NULL,
        taboo_words TEXT[] NOT NULL,
        FOREIGN KEY (set_uuid) REFERENCES word_sets(uuid) ON DELETE CASCADE
      );
    `);
    
    console.log('Database inizializzato con successo!');
  } catch (error) {
    console.error('Errore nell\'inizializzazione del database:', error);
  } finally {
    client.release();
  }
}

// Registrare o aggiornare un dispositivo
async function registerDevice(deviceId: string) {
  const client = await pool.connect();
  
  try {
    await client.query(`
      INSERT INTO devices (device_id, last_seen)
      VALUES ($1, CURRENT_TIMESTAMP)
      ON CONFLICT (device_id) 
      DO UPDATE SET last_seen = CURRENT_TIMESTAMP
    `, [deviceId]);
  } catch (error) {
    console.error('Errore nella registrazione del dispositivo:', error);
  } finally {
    client.release();
  }
}

// Salvare un nuovo set di parole
async function saveWordSet(wordSet: WordSet): Promise<WordSet> {
  const deviceId = await getDeviceId();
  await registerDevice(deviceId);
  
  const client = await pool.connect();
  const uuid = wordSet.id || uuidv4();
  
  try {
    await client.query('BEGIN');
    
    // Inserisci il set
    await client.query(`
      INSERT INTO word_sets (uuid, name, description, is_custom, created_at, device_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (uuid) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description
    `, [uuid, wordSet.name, wordSet.description, wordSet.isCustom, new Date(wordSet.createdAt), deviceId]);
    
    // Se ci sono carte, inseriscile
    if (wordSet.cards && wordSet.cards.length > 0) {
      // Prima elimina eventuali carte esistenti (in caso di aggiornamento)
      await client.query('DELETE FROM taboo_cards WHERE set_uuid = $1', [uuid]);
      
      // Poi inserisci le nuove carte
      for (const card of wordSet.cards) {
        await client.query(`
          INSERT INTO taboo_cards (set_uuid, main_word, taboo_words)
          VALUES ($1, $2, $3)
        `, [uuid, card.mainWord, card.tabooWords]);
      }
    }
    
    await client.query('COMMIT');
    
    return {
      ...wordSet,
      id: uuid
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Errore nel salvataggio del set di parole:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Caricare tutti i set di parole
async function loadWordSets(): Promise<WordSet[]> {
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
    
    return sets;
  } catch (error) {
    console.error('Errore nel caricamento dei set di parole:', error);
    return [];
  } finally {
    client.release();
  }
}

// Verificare se l'utente può eliminare un set
async function canDeleteWordSet(setId: string): Promise<boolean> {
  const deviceId = await getDeviceId();
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
}

// Eliminare un set di parole
async function deleteWordSet(setId: string): Promise<boolean> {
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
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Errore nell\'eliminazione del set di parole:', error);
    return false;
  } finally {
    client.release();
  }
}

// Inizializza il database all'avvio dell'applicazione
initDatabase().catch(console.error);

export {
  getDeviceId,
  saveWordSet,
  loadWordSets,
  canDeleteWordSet,
  deleteWordSet
};
