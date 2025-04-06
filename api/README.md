# API BeaterBoo

Servizio API per l'applicazione BeaterBoo Taboo Game. Questo servizio gestisce tutte le operazioni sul database PostgreSQL.

## Funzionalità

- Gestione dei set di parole
- Interfaccia RESTful
- Autenticazione basata su device-id
- Connessione diretta al database PostgreSQL

## Installazione

```bash
bun install
```

## Sviluppo

```bash
bun run dev
```

## Deploy

Per il deploy su Vercel:

1. Configura correttamente la variabile di ambiente `DATABASE_URL` su Vercel
2. Assicurati che il servizio Neon PostgreSQL sia raggiungibile dall'esterno
3. Deploy con Vercel CLI o tramite GitHub

## Endpoint API

- `GET /api/wordsets` - Ottiene tutti i set di parole
- `POST /api/wordsets` - Crea un nuovo set di parole
- `PUT /api/wordsets` - Aggiorna un set di parole esistente
- `GET /api/wordsets/:id/permissions` - Verifica i permessi di eliminazione
- `DELETE /api/wordsets/:id` - Elimina un set di parole

## Note

Gli header delle richieste devono includere `X-Device-ID` per l'identificazione del dispositivo. 