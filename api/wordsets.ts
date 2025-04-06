import { VercelRequest, VercelResponse } from '@vercel/node';
// Usiamo require che è più compatibile con pg
const pg = require('pg');
const http = require('http');

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

// Configurazione del pool di connessioni PostgreSQL - creiamo il pool solo quando serve
const createPool = () => {
  const { Pool } = pg;
  return new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_jgcz7wBDkAE8@ep-weathered-bar-a5p9x10j-pooler.us-east-2.aws.neon.tech/beaterboo',
    ssl: {
      rejectUnauthorized: false
    }
  });
};

// Inizializza il database
async function initDatabase() {
  const pool = createPool();
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
    pool.end();
  }
}

// Inizializza il database all'avvio dell'applicazione
initDatabase().catch(console.error);

// Impostazione CORS per le risposte
function setCorsHeaders(res) {
  // Allow from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-ID');
}

async function handler(req, res) {
  // Gestione CORS
  setCorsHeaders(res);
  
  // Gestione richieste OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  
  // Ottenere l'ID del dispositivo dall'header
  const deviceId = req.headers['x-device-id'] || '';
  
  // Crea il pool di connessione
  const pool = createPool();
  
  // Legge il corpo della richiesta per metodi POST/PUT
  if (req.method === 'POST' || req.method === 'PUT') {
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const data = Buffer.concat(buffers).toString();
    try {
      req.body = JSON.parse(data);
    } catch (e) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    }
  }

  // In base al percorso e al metodo, gestisci diverse operazioni
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const isWordSetsAPI = pathSegments[0] === 'api' && pathSegments[1] === 'wordsets';
    
    if (!isWordSetsAPI) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: 'API endpoint not found' }));
    }
    
    // GET /api/wordsets - Ottieni tutti i set
    if (req.method === 'GET' && !url.searchParams.get('id')) {
      const client = await pool.connect();
      
      try {
        // Ottieni tutti i set
        const setsResult = await client.query(`
          SELECT * FROM word_sets
          ORDER BY created_at DESC
        `);
        
        const sets = [];
        
        // Per ogni set, ottieni le carte
        for (const setRow of setsResult.rows) {
          const cardsResult = await client.query(`
            SELECT * FROM taboo_cards
            WHERE set_uuid = $1
          `, [setRow.uuid]);
          
          const cards = cardsResult.rows.map((card) => ({
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
        
        res.statusCode = 200;
        return res.end(JSON.stringify(sets));
      } finally {
        client.release();
      }
    }
    
    // POST /api/wordsets - Crea un nuovo set
    if (req.method === 'POST') {
      const wordSet = req.body;
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
        
        res.statusCode = 200;
        return res.end(JSON.stringify(wordSet));
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    
    // GET /api/wordsets?id=XXX - Ottieni un set specifico
    if (req.method === 'GET' && url.searchParams.get('id')) {
      const setId = url.searchParams.get('id');
      const checkPermissions = url.searchParams.get('permissions') === 'true';
      
      // Se richiediamo solo i permessi
      if (checkPermissions) {
        const client = await pool.connect();
        
        try {
          const result = await client.query(
            'SELECT device_id FROM word_sets WHERE uuid = $1',
            [setId]
          );
          
          if (result.rows.length === 0) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: 'Set not found' }));
          }
          
          const canDelete = result.rows[0].device_id === deviceId;
          
          res.statusCode = 200;
          return res.end(JSON.stringify({ canDelete }));
        } finally {
          client.release();
        }
      }
      
      // Altrimenti restituisci il set completo
      const client = await pool.connect();
      
      try {
        const setResult = await client.query(
          'SELECT * FROM word_sets WHERE uuid = $1',
          [setId]
        );
        
        if (setResult.rows.length === 0) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Set not found' }));
        }
        
        const setRow = setResult.rows[0];
        
        const cardsResult = await client.query(
          'SELECT * FROM taboo_cards WHERE set_uuid = $1',
          [setId]
        );
        
        const cards = cardsResult.rows.map((card) => ({
          id: card.id.toString(),
          mainWord: card.main_word,
          tabooWords: card.taboo_words
        }));
        
        const wordSet = {
          id: setRow.uuid,
          name: setRow.name,
          description: setRow.description,
          isCustom: setRow.is_custom,
          createdAt: setRow.created_at.toISOString(),
          cards,
          creatorDeviceId: setRow.device_id
        };
        
        res.statusCode = 200;
        return res.end(JSON.stringify(wordSet));
      } finally {
        client.release();
      }
    }
    
    // DELETE /api/wordsets?id=XXX - Elimina un set
    if (req.method === 'DELETE' && url.searchParams.get('id')) {
      const setId = url.searchParams.get('id');
      const client = await pool.connect();
      
      try {
        // Verifica che l'utente sia il proprietario
        const permResult = await client.query(
          'SELECT device_id FROM word_sets WHERE uuid = $1',
          [setId]
        );
        
        if (permResult.rows.length === 0) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Set not found' }));
        }
        
        if (permResult.rows[0].device_id !== deviceId) {
          res.statusCode = 403;
          return res.end(JSON.stringify({ error: 'Permission denied' }));
        }
        
        // Elimina il set (le carte associate verranno eliminate a cascata)
        await client.query('DELETE FROM word_sets WHERE uuid = $1', [setId]);
        
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true }));
      } finally {
        client.release();
      }
    }
    
    // Se arriviamo qui, endpoint non trovato
    res.statusCode = 404;
    return res.end(JSON.stringify({ error: 'Method not supported' }));
    
  } catch (error) {
    console.error('Errore nella gestione della richiesta:', error);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Internal server error' }));
  } finally {
    pool.end();
  }
}

// Crea un server HTTP che risponde sulla porta 3001
const PORT = process.env.PORT || 3001;
const server = http.createServer(async (req, res) => {
  // Imposta il tipo di contenuto a JSON per tutte le risposte
  res.setHeader('Content-Type', 'application/json');
  
  try {
    await handler(req, res);
  } catch (error) {
    console.error('Errore non gestito:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

// Avvia il server
server.listen(PORT, () => {
  console.log(`🚀 Server API avviato su http://localhost:${PORT}`);
}); 