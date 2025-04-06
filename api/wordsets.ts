import { Pool } from 'pg';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Interfacce per i tipi
interface TabooCard {
  id: string;
  mainWord: string;
  tabooWords: string[];
}

interface WordSet {
  id: string;
  name: string;
  description: string;
  isCustom: boolean;
  createdAt: string;
  cards: TabooCard[];
  creatorDeviceId?: string;
}

// Configurazione del pool di connessioni PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_jgcz7wBDkAE8@ep-weathered-bar-a5p9x10j-pooler.us-east-2.aws.neon.tech/beaterboo',
  ssl: {
    rejectUnauthorized: false
  }
});

// Inizializza il database
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

// Assicurati che il database sia inizializzato
initDatabase().catch(console.error);

// Impostazione CORS per le risposte
function setCorsHeaders(res: VercelResponse) {
  // Allow from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-ID');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Gestione CORS
  setCorsHeaders(res);
  
  // Gestione richieste OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Ottenere l'ID del dispositivo dall'header
  const deviceId = req.headers['x-device-id'] as string || '';
  
  // In base al percorso e al metodo, gestisci diverse operazioni
  try {
    // GET /api/wordsets - Ottieni tutti i set
    if (req.method === 'GET' && !req.query.id) {
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
          
          const cards: TabooCard[] = cardsResult.rows.map(card => ({
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
        
        return res.status(200).json(sets);
      } finally {
        client.release();
      }
    }
    
    // POST /api/wordsets - Crea un nuovo set
    if (req.method === 'POST') {
      const wordSet = req.body as WordSet;
      const uuid = wordSet.id;
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
        
        return res.status(200).json(wordSet);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    
    // PUT /api/wordsets - Aggiorna un set esistente
    if (req.method === 'PUT') {
      // Riutilizziamo la stessa implementazione di POST
      req.method = 'POST';
      return handler(req, res);
    }
    
    // GET /api/wordsets?id=XXX&permissions=true - Verifica permessi
    if (req.method === 'GET' && req.query.id && req.query.permissions) {
      const setId = req.query.id as string;
      const client = await pool.connect();
      
      try {
        const result = await client.query(`
          SELECT 1 FROM word_sets
          WHERE uuid = $1 AND device_id = $2
        `, [setId, deviceId]);
        
        return res.status(200).json({ 
          canDelete: result.rowCount !== null && result.rowCount > 0 
        });
      } finally {
        client.release();
      }
    }
    
    // DELETE /api/wordsets?id=XXX - Elimina un set
    if (req.method === 'DELETE' && req.query.id) {
      const setId = req.query.id as string;
      const client = await pool.connect();
      
      try {
        // Prima verifica se l'utente può eliminare il set
        const permResult = await client.query(`
          SELECT 1 FROM word_sets
          WHERE uuid = $1 AND device_id = $2
        `, [setId, deviceId]);
        
        if (permResult.rowCount === 0) {
          return res.status(403).json({ 
            error: 'Non hai i permessi per eliminare questo set' 
          });
        }
        
        await client.query('BEGIN');
        
        // Elimina tutte le carte associate al set
        await client.query('DELETE FROM taboo_cards WHERE set_uuid = $1', [setId]);
        
        // Elimina il set
        await client.query('DELETE FROM word_sets WHERE uuid = $1', [setId]);
        
        await client.query('COMMIT');
        
        return res.status(200).json({ success: true });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    
    // Se arrivi qui, il percorso non è supportato
    return res.status(404).json({ error: 'Endpoint non trovato' });
    
  } catch (error) {
    console.error('Errore nella gestione della richiesta:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
} 