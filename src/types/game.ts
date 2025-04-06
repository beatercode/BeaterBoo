export interface TabooCard {
  mainWord: string;
  tabooWords: string[];
  id: string;
}

export interface WordSet {
  id: string;
  name: string;
  description: string;
  cards: TabooCard[];
  isCustom: boolean;
  createdAt: string;
  creatorDeviceId?: string; // L'ID del dispositivo che ha creato il set
}

export interface Player {
  id: string;
  name: string;
}

export interface GameState {
  cards: TabooCard[];
  currentCardIndex: number;
  score: number;
  timeLeft: number;
  isPlaying: boolean;
  currentPlayerIndex: number;
  players: Player[];
  scores: Record<string, number>; // Mappa degli ID giocatore ai punteggi
  roundNumber: number;
  totalRounds: number;
  selectedWordSet?: WordSet;
}

export type GamePhase = 'menu' | 'setup' | 'wordSets' | 'wordSetGeneration' | 'game' | 'roundEnd' | 'gameEnd';
