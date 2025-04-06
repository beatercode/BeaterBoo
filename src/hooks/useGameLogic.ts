import React from 'react';
import { TabooCard, GameState, Player, WordSet } from '../types/game';

const ROUND_TIME = 60; // 60 seconds per round
const TOTAL_ROUNDS = 6; // 3 rounds per team

const initialState: GameState = {
  cards: [],
  currentCardIndex: 0,
  score: 0,
  timeLeft: ROUND_TIME,
  isPlaying: false,
  currentPlayerIndex: 0,
  players: [],
  scores: {},
  roundNumber: 1,
  totalRounds: TOTAL_ROUNDS,
  selectedWordSet: undefined
};

export const useGameLogic = () => {
  const [gameState, setGameState] = React.useState<GameState>(initialState);
  const [timer, setTimer] = React.useState<NodeJS.Timeout | null>(null);

  const startGame = React.useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      timeLeft: ROUND_TIME,
      score: 0
    }));

    const newTimer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          clearInterval(newTimer);
          return {
            ...prev,
            timeLeft: 0,
            isPlaying: false
          };
        }
        return {
          ...prev,
          timeLeft: prev.timeLeft - 1
        };
      });
    }, 1000);

    setTimer(newTimer);
  }, []);

  const endTurn = React.useCallback(() => {
    if (timer) {
      clearInterval(timer);
    }
    setGameState(prev => {
      const nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      return {
        ...prev,
        isPlaying: false,
        currentPlayerIndex: nextPlayerIndex,
        timeLeft: ROUND_TIME,
        roundNumber: prev.roundNumber + 1
      };
    });
  }, [timer]);

  const correctGuess = React.useCallback(() => {
    setGameState(prev => {
      const currentPlayerId = prev.players[prev.currentPlayerIndex]?.id;
      const currentScore = prev.scores[currentPlayerId] || 0;
      
      return {
        ...prev,
        currentCardIndex: (prev.currentCardIndex + 1) % prev.cards.length,
        scores: {
          ...prev.scores,
          [currentPlayerId]: currentScore + 1
        }
      };
    });
  }, []);

  const skipCard = React.useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentCardIndex: (prev.currentCardIndex + 1) % prev.cards.length
    }));
  }, []);

  const setCards = React.useCallback((cards: TabooCard[]) => {
    setGameState(prev => ({
      ...prev,
      cards,
      currentCardIndex: 0
    }));
  }, []);

  const setPlayers = React.useCallback((players: Player[]) => {
    // Inizializza i punteggi per tutti i giocatori
    const scores: Record<string, number> = {};
    players.forEach(player => {
      scores[player.id] = 0;
    });

    setGameState(prev => ({
      ...prev,
      players,
      scores,
      currentPlayerIndex: 0
    }));
  }, []);

  const setWordSet = React.useCallback((wordSet: WordSet) => {
    setGameState(prev => ({
      ...prev,
      selectedWordSet: wordSet,
      cards: wordSet.cards
    }));
  }, []);

  const startNewRound = React.useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      timeLeft: ROUND_TIME,
      currentCardIndex: Math.floor(Math.random() * prev.cards.length)
    }));
  }, []);

  // Ottieni il giocatore corrente
  const getCurrentPlayer = React.useCallback(() => {
    return gameState.players[gameState.currentPlayerIndex];
  }, [gameState.players, gameState.currentPlayerIndex]);

  // Ottieni tutti i punteggi ordinati
  const getOrderedScores = React.useCallback(() => {
    return gameState.players.map(player => ({
      player,
      score: gameState.scores[player.id] || 0
    })).sort((a, b) => b.score - a.score);
  }, [gameState.players, gameState.scores]);

  React.useEffect(() => {
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [timer]);

  return {
    gameState,
    startGame,
    endTurn,
    correctGuess,
    skipCard,
    setCards,
    setPlayers,
    setWordSet,
    startNewRound,
    getCurrentPlayer,
    getOrderedScores
  };
};
