import { Pool } from 'pg';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { TabooCard, WordSet } from '../src/types/game';

// Configurazione del pool di connessioni PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_jgcz7wBDkAE8@ep-weathered-bar-a5p9x10j-pooler.us-east-2.aws.neon.tech/beaterboo',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
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

// Implementazione delle funzioni API
async function getWordSets(): Promise<WordSet[]> {
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
    throw error;
  } finally {
    client.release();
  }
}

async function saveWordSet(wordSet: WordSet, deviceId: string): Promise<WordSet> {
  const client = await pool.connect();
  const uuid = wordSet.id;
  
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
    
    return wordSet;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Errore nel salvataggio del set di parole:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function canDeleteWordSet(setId: string, deviceId: string): Promise<boolean> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 1 FROM word_sets
      WHERE uuid = $1 AND device_id = $2
    `, [setId, deviceId]);
    
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Errore nella verifica dei permessi di eliminazione:', error);
    return false;
  } finally {
    client.release();
  }
}

async function deleteWordSet(setId: string, deviceId: string): Promise<boolean> {
  if (!await canDeleteWordSet(setId, deviceId)) {
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

// Helper per leggere il body di una richiesta
const getRequestBody = async (req: IncomingMessage): Promise<any> => {
  return new Promise((resolve) => {
    const bodyParts: any[] = [];
    req.on('data', (chunk) => {
      bodyParts.push(chunk);
    }).on('end', () => {
      const body = Buffer.concat(bodyParts).toString();
      resolve(body ? JSON.parse(body) : {});
    });
  });
};

// Cors middleware
const setCorsHeaders = (res: ServerResponse, req: IncomingMessage) => {
  // In development allow requests from any origin, in production only allow specific origins
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://beaterboo.vercel.app', 'https://beaterboo-api.vercel.app'] 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
  
  const origin = req.headers.origin || '';
  
  // Se l'origine è nell'elenco delle origini consentite o se siamo in sviluppo, la consentiamo
  if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Altrimenti impostiamo un'origine predefinita
    res.setHeader('Access-Control-Allow-Origin', 'https://beaterboo.vercel.app');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-ID');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
};

// Crea il server HTTP
const server = createServer(async (req, res) => {
  try {
    setCorsHeaders(res, req);
    
    // Gestione richieste OPTIONS
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    const { pathname } = parse(req.url || '', true);
    const deviceId = req.headers['x-device-id'] as string || '';
    
    // Route per ottenere tutti i set
    if (pathname === '/api/wordsets' && req.method === 'GET') {
      const sets = await getWordSets();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(sets));
      return;
    }
    
    // Route per salvare un set
    if (pathname === '/api/wordsets' && (req.method === 'POST' || req.method === 'PUT')) {
      const wordSet = await getRequestBody(req);
      const savedSet = await saveWordSet(wordSet, deviceId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(savedSet));
      return;
    }
    
    // Route per verificare i permessi di eliminazione
    if (pathname?.match(/\/api\/wordsets\/(.+)\/permissions/) && req.method === 'GET') {
      const setId = pathname.split('/')[3];
      const canDelete = await canDeleteWordSet(setId, deviceId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ canDelete }));
      return;
    }
    
    // Route per eliminare un set
    if (pathname?.match(/\/api\/wordsets\/(.+)/) && req.method === 'DELETE') {
      const setId = pathname.split('/')[3];
      const success = await deleteWordSet(setId, deviceId);
      
      if (success) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Non hai i permessi per eliminare questo set' }));
      }
      return;
    }
    
    // Route non trovata
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Risorsa non trovata' }));
  } catch (error) {
    console.error('Errore nel gestire la richiesta:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Errore interno del server' }));
  }
});

// Inizializza il database all'avvio
initDatabase().catch(console.error);

// Funzione per l'ambiente di sviluppo
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
  });
}

// Esporta il server per l'uso serverless
export default server; 