import React from 'react';
import { Card, CardBody, Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

interface RoundEndProps {
  team1Score: number;
  team2Score: number;
  roundNumber: number;
  totalRounds: number;
  onNextRound: () => void;
  onEndGame: () => void;
}

export const RoundEnd: React.FC<RoundEndProps> = ({
  team1Score,
  team2Score,
  roundNumber,
  totalRounds,
  onNextRound,
  onEndGame,
}) => {
  const isGameEnd = roundNumber >= totalRounds;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-md mx-auto"
    >
      <Card>
        <CardBody className="text-center space-y-4">
          <h2 className="text-2xl font-bold">
            {isGameEnd ? 'Fine Partita!' : `Fine Round ${roundNumber}`}
          </h2>
          
          <div className="flex justify-around my-6">
            <div className="text-center">
              <p className="text-sm">Squadra 1</p>
              <p className="text-3xl font-bold text-primary">{team1Score}</p>
            </div>
            <div className="text-center">
              <p className="text-sm">Squadra 2</p>
              <p className="text-3xl font-bold text-primary">{team2Score}</p>
            </div>
          </div>

          {isGameEnd ? (
            <div className="space-y-2">
              <h3 className="text-xl font-bold">
                {team1Score > team2Score ? 'Vince la Squadra 1!' : 
                 team2Score > team1Score ? 'Vince la Squadra 2!' : 
                 'Pareggio!'}
              </h3>
              <Button
                color="primary"
                size="lg"
                className="w-full"
                onPress={onEndGame}
                startContent={<Icon icon="lucide:home" />}
              >
                Torna al Menu
              </Button>
            </div>
          ) : (
            <Button
              color="primary"
              size="lg"
              className="w-full"
              onPress={onNextRound}
              startContent={<Icon icon="lucide:arrow-right" />}
            >
              Prossimo Round
            </Button>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
};
