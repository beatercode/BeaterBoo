import React from 'react';
import { Card, CardBody, Progress } from '@heroui/react';
import { motion } from 'framer-motion';

interface ScoreDisplayProps {
  team1Score: number;
  team2Score: number;
  currentTeam: 'team1' | 'team2';
  timeLeft: number;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  team1Score,
  team2Score,
  currentTeam,
  timeLeft
}) => {
  const maxTime = 60;
  const timeProgress = (timeLeft / maxTime) * 100;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card className="w-full max-w-md mx-auto mb-4 shadow-lg backdrop-blur-sm bg-content1/90">
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <motion.div 
              className={`text-center ${currentTeam === 'team1' ? 'text-primary' : ''}`}
              animate={{ scale: currentTeam === 'team1' ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <p className="text-sm font-medium">Team 1</p>
              <p className="text-2xl font-bold">{team1Score}</p>
            </motion.div>
            <div className="text-center flex-1 mx-4">
              <p className="text-sm font-medium mb-1">Tempo</p>
              <Progress 
                value={timeProgress}
                color={timeProgress < 25 ? "danger" : timeProgress < 50 ? "warning" : "success"}
                className="max-w-md"
                aria-label="Tempo rimanente"
              />
              <p className="text-lg font-bold mt-1">{timeLeft}s</p>
            </div>
            <motion.div 
              className={`text-center ${currentTeam === 'team2' ? 'text-primary' : ''}`}
              animate={{ scale: currentTeam === 'team2' ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <p className="text-sm font-medium">Team 2</p>
              <p className="text-2xl font-bold">{team2Score}</p>
            </motion.div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};
