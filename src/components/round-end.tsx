import React from 'react';
import { Card, CardBody, Button, Divider } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Player } from '../types/game';

interface RoundEndProps {
  players: Player[];
  scores: Record<string, number>;
  roundNumber: number;
  totalRounds: number;
  onNextRound: () => void;
  onEndGame: () => void;
}

export const RoundEnd: React.FC<RoundEndProps> = ({
  players,
  scores,
  roundNumber,
  totalRounds,
  onNextRound,
  onEndGame
}) => {
  const isGameEnd = roundNumber >= totalRounds * players.length;
  
  // Ordina i giocatori per punteggio in ordine decrescente
  const sortedPlayers = [...players].sort((a, b) => 
    (scores[b.id] || 0) - (scores[a.id] || 0)
  );
  
  // Trova il vincitore (o i vincitori in caso di parità)
  const winners = sortedPlayers.length > 0 ? 
    sortedPlayers.filter(p => scores[p.id] === scores[sortedPlayers[0].id]) : 
    [];
  
  const isLastPlayer = roundNumber % players.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="shadow-lg">
        <CardBody className="space-y-6 text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {isGameEnd ? "Fine Partita!" : isLastPlayer ? "Fine Round!" : "Cambio turno!"}
          </h2>
          
          <div className="space-y-4">
            {isGameEnd && (
              <div>
                <h3 className="text-xl font-bold">
                  {winners.length === 1 ? (
                    <>Vincitore: <span className="text-primary">{winners[0].name}</span></>
                  ) : (
                    <>Parità tra: <span className="text-primary">{winners.map(w => w.name).join(', ')}</span></>
                  )}
                </h3>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-bold mb-2">Punteggi:</h3>
              <div className="space-y-2">
                {sortedPlayers.map((player, index) => (
                  <div 
                    key={player.id} 
                    className={`flex justify-between items-center p-2 rounded-md ${index === 0 && winners.length === 1 ? 'bg-primary-100' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {index === 0 && sortedPlayers.length > 1 && scores[player.id] > 0 && (
                        <span className="text-xl">👑</span>
                      )}
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <span className="text-xl font-bold">{scores[player.id] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {!isGameEnd && (
              <div>
                <p className="text-default-500">
                  Round {Math.ceil(roundNumber / players.length)} di {totalRounds}
                </p>
              </div>
            )}
          </div>
          
          <Divider />
          
          <div className="flex justify-center gap-4">
            {isGameEnd ? (
              <Button
                color="primary"
                size="lg"
                onPress={onEndGame}
                startContent={<Icon icon="lucide:home" />}
                className="shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all"
              >
                Torna al Menu
              </Button>
            ) : (
              <Button
                color="primary"
                size="lg"
                onPress={onNextRound}
                startContent={<Icon icon="lucide:arrow-right" />}
                className="shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all"
              >
                {isLastPlayer ? "Prossimo Round" : "Prossimo Giocatore"}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};
