import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { MainMenu } from './components/main-menu';
import { PlayerSetup } from './components/player-setup';
import { WordSetGenerator } from './components/word-set-generator';
import { WordSets } from './components/word-sets';
import { GameCard } from './components/game-card';
import { GameControls } from './components/game-controls';
import { ScoreDisplay } from './components/score-display';
import { RoundEnd } from './components/round-end';
import { BottomNav } from './components/bottom-nav';
import { useGameLogic } from './hooks/useGameLogic';
import { GamePhase, Player, TabooCard, WordSet } from './types/game';
import { generateTabooWords } from './services/gemini';
import { loadWordSets, saveWordSet, deleteWordSet, canDeleteWordSet } from './services/database';

const mockWordSets: WordSet[] = [
  {
    id: '1',
    name: 'Set Base',
    description: 'Il set di parole classico del gioco Taboo',
    cards: [
      { id: '1', mainWord: 'Calcio', tabooWords: ['Pallone', 'Goal', 'Campo', 'Squadra', 'Giocatore'] },
    ],
    isCustom: false,
    createdAt: '2024-01-01'
  }
];

export default function App() {
  const [wordSets, setWordSets] = React.useState<WordSet[]>([]);
  const [gamePhase, setGamePhase] = React.useState<GamePhase>('menu');
  const [isAddingCardsToSet, setIsAddingCardsToSet] = React.useState(false);
  const [targetWordSetId, setTargetWordSetId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Impostazione globale per impedire lo scrolling
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      html, body {
        overflow: hidden;
        position: fixed;
        width: 100%;
        height: 100%;
        max-width: 100%;
        overscroll-behavior: none;
      }
      
      .allow-scroll {
        overflow-y: auto;
        height: calc(100vh - 4rem); /* Altezza totale meno la navbar */
        padding-bottom: 1rem;
      }

      /* Forza la navbar in basso */
      nav[class*="fixed"] {
        top: auto !important;
        bottom: 0 !important;
        position: fixed !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const {
    gameState,
    startGame,
    endTurn,
    correctGuess,
    skipCard,
    setPlayers,
    startNewRound,
    setWordSet
  } = useGameLogic();
  
  const handleNavigate = React.useCallback((phase: GamePhase) => {
    if (gameState.isPlaying) {
      if (window.confirm('Vuoi davvero abbandonare la partita in corso?')) {
        setGamePhase(phase);
      }
    } else {
      setGamePhase(phase);
    }
  }, [gameState.isPlaying]);

  const handleStartNewGame = () => {
    if (!gameState.selectedWordSet) {
      setGamePhase('wordSets');
    } else {
      setGamePhase('setup');
    }
  };

  const handlePlayersSetup = (players: Player[]) => {
    setPlayers(players);
    setGamePhase('game');
  };

  const handleGenerateWordSet = () => {
    setGamePhase('wordSetGeneration');
  };

  const handleWordSetGenerated = async (cards: TabooCard[], setName: string) => {
    try {
      const newSet: WordSet = {
        id: Date.now().toString(), // ID temporaneo
        name: setName,
        description: `Set personalizzato creato il ${new Date().toLocaleDateString()}`,
        cards,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
      
      // Salva il set nel database
      const savedSet = await saveWordSet(newSet);
      
      // Aggiorna lo stato locale
      setWordSets(prev => [savedSet, ...prev]);
      
      // Torna al menu principale
      setGamePhase('menu');
    } catch (error) {
      console.error('Errore nel salvataggio del set:', error);
      setErrorMessage('Errore nel salvataggio del set di parole');
      
      // Fallback: Aggiungi comunque il set localmente
      const fallbackSet: WordSet = {
        id: Date.now().toString(),
        name: setName,
        description: `Set personalizzato creato il ${new Date().toLocaleDateString()}`,
        cards,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
      
      setWordSets(prev => [fallbackSet, ...prev]);
      setGamePhase('menu');
    }
  };

  const handleDeleteWordSet = async (setId: string) => {
    try {
      // Verifica se l'utente può eliminare questo set
      if (await canDeleteWordSet(setId)) {
        // Elimina dal database
        const success = await deleteWordSet(setId);
        
        if (success) {
          // Rimuovi dallo stato locale
          setWordSets(prev => prev.filter(set => set.id !== setId));
        } else {
          setErrorMessage('Non è stato possibile eliminare il set');
        }
      } else {
        setErrorMessage('Non hai i permessi per eliminare questo set');
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione del set:', error);
      setErrorMessage('Errore durante l\'eliminazione del set');
    }
  };

  const handleAddCardsToSet = async (wordSetId: string, onGenerationComplete: () => void) => {
    const targetSet = wordSets.find(set => set.id === wordSetId);
    if (!targetSet) return;
    
    setTargetWordSetId(wordSetId);
    setIsAddingCardsToSet(true);
    
    // Genera direttamente le parole invece di navigare alla schermata di generazione
    const generateNewCards = async () => {
      const existingWords = targetSet.cards.map(card => card.mainWord);
      
      try {
        // Genera nuove carte
        const newCards = await generateTabooWords(
          targetSet.name, // Usa il nome del set come topic
          "", // Categoria vuota
          30, // Numero fisso di carte da aggiungere
          existingWords
        );
        
        // Crea un set aggiornato con le nuove carte
        const updatedSet: WordSet = {
          ...targetSet,
          cards: [...targetSet.cards, ...newCards]
        };
        
        // Salva il set aggiornato nel database
        const savedSet = await saveWordSet(updatedSet);
        
        // Aggiorna lo stato locale
        setWordSets(prev => prev.map(set => 
          set.id === wordSetId ? savedSet : set
        ));
        
        setTargetWordSetId(null);
        setIsAddingCardsToSet(false);
        
        // Chiama la callback per notificare il completamento
        onGenerationComplete();
      } catch (error) {
        console.error('Errore nella generazione delle parole:', error);
        setErrorMessage('Errore nella generazione delle parole');
        
        setTargetWordSetId(null);
        setIsAddingCardsToSet(false);
        
        // Chiama comunque la callback, anche in caso di errore
        onGenerationComplete();
      }
    };
    
    generateNewCards();
  };

  const handleSelectWordSet = (wordSet: WordSet) => {
    setWordSet(wordSet);
    setGamePhase('menu');
  };

  const handleCardsAddedToSet = (cards: TabooCard[]) => {
    if (!targetWordSetId) return;
    
    setWordSets(prev => prev.map(set => {
      if (set.id === targetWordSetId) {
        return {
          ...set,
          cards: [...set.cards, ...cards]
        };
      }
      return set;
    }));
    
    setTargetWordSetId(null);
    setIsAddingCardsToSet(false);
    
    setGamePhase('wordSets');
  };

  const handleRoundEnd = () => {
    // Se tutti i giocatori hanno giocato il loro turno in questo round
    if ((gameState.roundNumber) % gameState.players.length === 0) {
      // Se abbiamo completato tutti i round, termina il gioco
      if (gameState.roundNumber >= gameState.totalRounds * gameState.players.length) {
        setGamePhase('gameEnd');
      } else {
        setGamePhase('roundEnd'); 
      }
    } else {
      // Altrimenti passiamo semplicemente al giocatore successivo
      startNewRound();
    }
  };

  const handleNextRound = () => {
    startNewRound();
    setGamePhase('game');
  };

  const handleEndGame = () => {
    setGamePhase('menu');
  };

  // Carica i set di parole dal database all'avvio dell'app
  useEffect(() => {
    const fetchWordSets = async () => {
      try {
        setIsLoading(true);
        const sets = await loadWordSets();
        if (sets.length > 0) {
          setWordSets(sets);
        } else {
          // Mantieni i set mock se il database è vuoto
          setWordSets(mockWordSets);
        }
      } catch (error) {
        console.error('Errore nel caricamento dei set di parole:', error);
        setErrorMessage('Errore nel caricamento dei set di parole');
        // Fallback ai set mock in caso di errore
        setWordSets(mockWordSets);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWordSets();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-100 text-foreground px-4 pt-4 pb-20">
      <AnimatePresence mode="wait">
        {gamePhase === 'menu' && (
          <MainMenu
            onStartNewGame={handleStartNewGame}
            onWordSets={() => setGamePhase('wordSets')}
            onGenerateWordSet={handleGenerateWordSet}
            selectedWordSet={gameState.selectedWordSet}
          />
        )}

        {gamePhase === 'setup' && (
          <PlayerSetup
            onComplete={handlePlayersSetup}
            onBack={() => setGamePhase('menu')}
          />
        )}

        {gamePhase === 'wordSetGeneration' && (
          <WordSetGenerator
            onComplete={handleWordSetGenerated}
            onBack={() => setGamePhase('menu')}
          />
        )}

        {gamePhase === 'wordSets' && (
          <div className="allow-scroll">
            <WordSets
              wordSets={wordSets}
              onSelectWordSet={handleSelectWordSet}
              onBack={() => setGamePhase('menu')}
              onAddCardsToSet={handleAddCardsToSet}
              onDeleteWordSet={handleDeleteWordSet}
            />
          </div>
        )}

        {gamePhase === 'game' && (
          <div className="max-w-md mx-auto space-y-4">
            <ScoreDisplay
              players={gameState.players}
              scores={gameState.scores}
              currentPlayerIndex={gameState.currentPlayerIndex}
              timeLeft={gameState.timeLeft}
            />

            {!gameState.isPlaying ? (
              <div className="text-center">
                <h2 className="text-xl mb-4 font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {`Turno di ${gameState.players[gameState.currentPlayerIndex]?.name || 'Giocatore'}`}
                </h2>
                <Button
                  color="primary"
                  size="lg"
                  onPress={startGame}
                  startContent={<Icon icon="lucide:play" />}
                  className="shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all"
                >
                  Inizia
                </Button>
              </div>
            ) : (
              gameState.cards[gameState.currentCardIndex] && (
                <GameCard card={gameState.cards[gameState.currentCardIndex]} />
              )
            )}

            <GameControls
              onCorrect={correctGuess}
              onSkip={skipCard}
              onEndTurn={() => {
                endTurn();
                handleRoundEnd();
              }}
              isPlaying={gameState.isPlaying}
            />
          </div>
        )}

        {(gamePhase === 'roundEnd' || gamePhase === 'gameEnd') && (
          <RoundEnd
            players={gameState.players}
            scores={gameState.scores}
            roundNumber={gameState.roundNumber}
            totalRounds={gameState.totalRounds}
            onNextRound={handleNextRound}
            onEndGame={handleEndGame}
          />
        )}
      </AnimatePresence>

      <BottomNav currentPhase={gamePhase} onNavigate={handleNavigate} />
    </div>
  );
}
