# BeaterBoo - Advanced Taboo Game

BeaterBoo è un'applicazione moderna per giocare a Taboo, il classico gioco di parole in cui devi far indovinare una parola senza usare alcune parole tabù.

## Tecnologie utilizzate

- React 18
- Vite 6
- TailwindCSS
- HeroUI React Components
- Framer Motion per le animazioni
- Google Gemini API per generare parole tabù
- API RESTful per la connessione diretta al database

## Architettura

L'applicazione è composta da due parti principali:
1. **Frontend**: Applicazione React in `/src`
2. **Backend**: Servizio API in `/api`

### Frontend

Il frontend è una SPA React che comunica con il backend tramite API RESTful.

### Backend

Il backend è un'API serverless che gestisce tutte le operazioni sul database PostgreSQL. Ulteriori dettagli sono disponibili nel [README dell'API](./api/README.md).

## Funzionalità principali

- Creazione e gestione di set di parole personalizzati
- Generazione automatica di parole tabù tramite AI
- Interfaccia utente intuitiva e reattiva
- Persistenza dei dati su database PostgreSQL
- Sistema di punteggio e turni per più squadre

## Sviluppo

### Prerequisiti

- Node.js 16+ o Bun
- Un API key per Google Gemini (opzionale)
- Un database PostgreSQL (per il backend)

### Installazione

```bash
# Installa le dipendenze con bun
bun install

# Installa le dipendenze dell'API
cd api && bun install && cd ..
```

### Comandi principali

```bash
# Avvia il server di sviluppo frontend
bun run dev

# Avvia il server di sviluppo API
cd api && bun run dev

# Compila il frontend per la produzione
bun run build

# Compila l'API per la produzione
cd api && bun run build
```

## Deploy

Per il deploy completo dell'applicazione, si consiglia di:
1. Deployare il frontend su Vercel/Netlify
2. Deployare l'API su Vercel Functions o servizio simile
3. Configurare correttamente le variabili d'ambiente

## Note di ottimizzazione

L'applicazione è stata ottimizzata per:
- Utilizzare Vite come unico sistema di build
- Supportare la modalità offline con fallback a localStorage
- Ridurre la dimensione del bundle con esbuild
- Gestire in modo intelligente l'importazione dinamica di moduli server-side (pg)
