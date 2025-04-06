# BeaterBoo - Advanced Taboo Game

BeaterBoo è un'applicazione moderna per giocare a Taboo, il classico gioco di parole in cui devi far indovinare una parola senza usare alcune parole tabù.

## Tecnologie utilizzate

- React 18
- Vite 6
- TailwindCSS
- HeroUI React Components
- Framer Motion per le animazioni
- Google Gemini API per generare parole tabù
- Supporto offline tramite localStorage

## Funzionalità principali

- Creazione e gestione di set di parole personalizzati
- Generazione automatica di parole tabù tramite AI
- Interfaccia utente intuitiva e reattiva
- Modalità offline con persistenza locale
- Sistema di punteggio e turni per più squadre

## Sviluppo

### Prerequisiti

- Node.js 16+ o Bun
- Un API key per Google Gemini (opzionale)

### Installazione

```bash
# Installa le dipendenze con bun
bun install
```

### Comandi principali

```bash
# Avvia il server di sviluppo
bun run dev

# Compila per la produzione
bun run build

# Esegui il linting del codice
bun run lint
```

## Note di ottimizzazione

L'applicazione è stata ottimizzata per:
- Utilizzare Vite come unico sistema di build
- Supportare la modalità offline con fallback a localStorage
- Ridurre la dimensione del bundle con esbuild
- Gestire in modo intelligente l'importazione dinamica di moduli server-side (pg)
