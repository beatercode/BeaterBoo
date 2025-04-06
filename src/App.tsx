import React from 'react';
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

// Log that App component is being rendered
console.log('App component is rendering');

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
  console.log('Inside App function component');
  
  const [wordSets, setWordSets] = React.useState<WordSet[]>(mockWordSets);
  const [gamePhase, setGamePhase] = React.useState<GamePhase>('menu');
  const [isAddingCardsToSet, setIsAddingCardsToSet] = React.useState(false);
  const [targetWordSetId, setTargetWordSetId] = React.useState<string | null>(null);
  
  console.log('Current game phase:', gamePhase);
  
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
  
  console.log('Game state loaded:', gameState);

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

  const handlePlayersSetup = (team1Players: Player[], team2Players: Player[]) => {
    setPlayers(team1Players, team2Players);
    setGamePhase('game');
  };

  const handleGenerateWordSet = () => {
    setGamePhase('wordSetGeneration');
  };

  const handleWordSetGenerated = (cards: TabooCard[]) => {
    const newWordSet: WordSet = {
      id: Date.now().toString(),
      name: 'Set Personalizzato',
      description: 'Set di parole generato con AI',
      cards,
      isCustom: true,
      createdAt: new Date().toISOString()
    };
    setWordSets(prev => [...prev, newWordSet]);
    setWordSet(newWordSet);
    setGamePhase('menu');
  };

  const handleSelectWordSet = (wordSet: WordSet) => {
    setWordSet(wordSet);
    setGamePhase('menu');
  };

  const handleAddCardsToSet = (wordSetId: string, count: number) => {
    // Trova il set a cui aggiungere le carte
    const targetSet = wordSets.find(set => set.id === wordSetId);
    if (!targetSet) return;
    
    // Salva lo stato per la generazione
    setTargetWordSetId(wordSetId);
    setIsAddingCardsToSet(true);
    
    // Vai alla schermata di generazione, passando il conteggio desiderato
    setGamePhase('wordSetGeneration');
    
    // Il conteggio carte verrà utilizzato dal componente WordSetGenerator tramite initialCardCount
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
    
    // Resetta lo stato
    setTargetWordSetId(null);
    setIsAddingCardsToSet(false);
    
    // Torna alla lista dei set
    setGamePhase('wordSets');
  };

  const handleRoundEnd = () => {
    if (gameState.roundNumber >= gameState.totalRounds) {
      setGamePhase('gameEnd');
    } else {
      setGamePhase('roundEnd');
    }
  };

  const handleNextRound = () => {
    startNewRound();
    setGamePhase('game');
  };

  const handleEndGame = () => {
    setGamePhase('menu');
  };

  // Estrai le parole esistenti per evitare duplicati
  const getExistingWords = React.useMemo(() => {
    if (isAddingCardsToSet && targetWordSetId) {
      const targetSet = wordSets.find(set => set.id === targetWordSetId);
      return targetSet ? targetSet.cards.map(card => card.mainWord) : [];
    }
    return [];
  }, [isAddingCardsToSet, targetWordSetId, wordSets]);

  console.log('About to render UI');

  return (
    <div className="min-h-screen bg-background p-4 pb-24 relative overflow-hidden">
      {/* Sfondo migliorato con maggiore contrasto e effetti */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-radial from-primary-100/30 via-background to-background" />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary-200/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-primary-100/10 to-transparent" />
        <div className="absolute -left-24 top-1/4 w-64 h-64 rounded-full bg-secondary-100/10 blur-3xl" />
        <div className="absolute -right-24 top-2/3 w-80 h-80 rounded-full bg-primary-100/10 blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {gamePhase === 'menu' && (
          <MainMenu
            onStartNewGame={handleStartNewGame}
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

        {gamePhase === 'wordSets' && (
          <WordSets
            wordSets={wordSets}
            onSelectWordSet={handleSelectWordSet}
            onAddCardsToSet={handleAddCardsToSet}
            onBack={() => setGamePhase('menu')}
          />
        )}

        {gamePhase === 'wordSetGeneration' && (
          <WordSetGenerator
            onComplete={isAddingCardsToSet ? handleCardsAddedToSet : handleWordSetGenerated}
            onBack={() => isAddingCardsToSet ? setGamePhase('wordSets') : setGamePhase('menu')}
            existingWords={getExistingWords}
          />
        )}

        {gamePhase === 'game' && (
          <div className="max-w-md mx-auto space-y-4">
            <ScoreDisplay
              team1Score={gameState.team1Score}
              team2Score={gameState.team2Score}
              currentTeam={gameState.currentTeam}
              timeLeft={gameState.timeLeft}
            />

            {!gameState.isPlaying ? (
              <div className="text-center">
                <h2 className="text-xl mb-4 font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {`Turno Squadra ${gameState.currentTeam === 'team1' ? '1' : '2'}`}
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
            team1Score={gameState.team1Score}
            team2Score={gameState.team2Score}
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
