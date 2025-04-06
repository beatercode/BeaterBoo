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
  currentTeam: 'team1',
  team1Score: 0,
  team2Score: 0,
  team1Players: [],
  team2Players: [],
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
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      currentTeam: prev.currentTeam === 'team1' ? 'team2' : 'team1',
      timeLeft: ROUND_TIME,
      roundNumber: prev.roundNumber + 1
    }));
  }, [timer]);

  const correctGuess = React.useCallback(() => {
    setGameState(prev => {
      const newScore = prev.currentTeam === 'team1' ? 
        { team1Score: prev.team1Score + 1 } : 
        { team2Score: prev.team2Score + 1 };

      return {
        ...prev,
        currentCardIndex: (prev.currentCardIndex + 1) % prev.cards.length,
        ...newScore
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

  const setPlayers = React.useCallback((team1Players: Player[], team2Players: Player[]) => {
    setGameState(prev => ({
      ...prev,
      team1Players,
      team2Players
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
    startNewRound
  };
};
