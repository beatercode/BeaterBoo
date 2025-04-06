import React from 'react';
import { Card, CardBody, Progress, Chip } from '@heroui/react';
import { Player } from '../types/game';
import { motion, AnimatePresence } from 'framer-motion';

interface ScoreDisplayProps {
  players: Player[];
  scores: Record<string, number>;
  currentPlayerIndex: number;
  timeLeft: number;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ 
  players, 
  scores, 
  currentPlayerIndex, 
  timeLeft 
}) => {
  const currentPlayer = players[currentPlayerIndex];
  
  // Ordina i giocatori per punteggio in ordine decrescente
  const rankedPlayers = [...players].sort((a, b) => {
    return (scores[b.id] || 0) - (scores[a.id] || 0);
  });

  return (
    <Card>
      <CardBody>
        <Progress 
          aria-label="Tempo rimanente" 
          value={(timeLeft / 60) * 100} 
          color="primary"
          size="md"
          showValueLabel
          formatOptions={{ style: "unit", unit: "second" }}
          valueLabel={timeLeft.toString()}
        />
        
        <div className="mt-4">
          <h3 className="text-lg font-bold mb-2">Tocca a:</h3>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPlayerIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Chip color="primary" variant="solid" size="lg" className="font-bold">
                {currentPlayer?.name || "..."}
              </Chip>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <div className="mt-4">
          <h3 className="text-lg font-bold mb-2">Punteggi:</h3>
          <div className="space-y-2">
            {rankedPlayers.map((player, index) => (
              <div key={player.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {index === 0 && rankedPlayers.length > 1 && scores[player.id] > 0 && (
                    <span className="text-xl">👑</span>
                  )}
                  <span className={`${player.id === currentPlayer?.id ? 'font-bold' : ''}`}>
                    {player.name}
                  </span>
                </div>
                <Chip 
                  color={player.id === currentPlayer?.id ? "primary" : "default"} 
                  variant={player.id === currentPlayer?.id ? "solid" : "bordered"}
                >
                  {scores[player.id] || 0}
                </Chip>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
