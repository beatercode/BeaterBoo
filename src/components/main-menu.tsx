import React from 'react';
import { Card, CardBody, Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { WordSet } from '../types/game';

interface MainMenuProps {
  onStartNewGame: () => void;
  onGenerateWordSet: () => void;
  selectedWordSet?: WordSet;
}

export const MainMenu: React.FC<MainMenuProps> = ({ 
  onStartNewGame, 
  onGenerateWordSet,
  selectedWordSet 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto space-y-6"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="text-center"
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          BeaterBoo
        </h1>
        {selectedWordSet && (
          <p className="text-default-500">
            Set selezionato: {selectedWordSet.name}
          </p>
        )}
      </motion.div>

      <Card className="shadow-xl backdrop-blur-sm bg-content1/80">
        <CardBody className="space-y-4 p-6">
          <Button 
            size="lg" 
            color="primary" 
            className="w-full h-14 text-lg"
            startContent={<Icon icon="lucide:play" className="text-xl" />}
            onPress={onStartNewGame}
          >
            Nuova Partita
          </Button>
          <Button 
            size="lg" 
            variant="flat" 
            className="w-full h-14 text-lg"
            startContent={<Icon icon="lucide:sparkles" className="text-xl" />}
            onPress={onGenerateWordSet}
          >
            Genera Set di Parole
          </Button>
        </CardBody>
      </Card>

      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary-100/30 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary-100/20 to-transparent" />
      </div>
    </motion.div>
  );
};
