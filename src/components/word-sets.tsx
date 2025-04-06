import React from 'react';
import { Card, CardBody, Chip } from '@heroui/react';
import { motion } from 'framer-motion';
import { WordSet } from '../types/game';

interface WordSetsProps {
  wordSets: WordSet[];
  onSelectWordSet: (wordSet: WordSet) => void;
  // onBack is kept in the interface for future use if needed
  onBack?: () => void;
}

export const WordSets: React.FC<WordSetsProps> = ({
  wordSets,
  onSelectWordSet,
  // We're not using onBack but keeping it in the interface for future use
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="w-full max-w-md mx-auto space-y-4 pb-20"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Set di Parole</h2>
      </div>

      <div className="space-y-4">
        {wordSets.map((wordSet) => (
          <Card
            key={wordSet.id}
            isPressable
            onPress={() => onSelectWordSet(wordSet)}
            className="w-full"
          >
            <CardBody className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{wordSet.name}</h3>
                  <p className="text-sm text-default-500">{wordSet.description}</p>
                </div>
                {wordSet.isCustom && (
                  <Chip color="primary" variant="flat" size="sm">
                    Personalizzato
                  </Chip>
                )}
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-default-400">
                  {wordSet.cards.length} parole
                </span>
                <span className="text-sm text-default-400">
                  {new Date(wordSet.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};
