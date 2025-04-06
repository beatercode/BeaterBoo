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
}

export interface Player {
  id: string;
  name: string;
  team: 'team1' | 'team2';
}

export interface GameState {
  cards: TabooCard[];
  currentCardIndex: number;
  score: number;
  timeLeft: number;
  isPlaying: boolean;
  currentTeam: 'team1' | 'team2';
  team1Score: number;
  team2Score: number;
  team1Players: Player[];
  team2Players: Player[];
  roundNumber: number;
  totalRounds: number;
  selectedWordSet?: WordSet;
}

export type GamePhase = 'menu' | 'setup' | 'wordSets' | 'wordSetGeneration' | 'game' | 'roundEnd' | 'gameEnd';
