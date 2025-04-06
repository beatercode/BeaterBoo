import React from 'react';
import { Card, CardBody, Divider } from '@heroui/react';
import { motion } from 'framer-motion';
import { TabooCard } from '../types/game';

interface GameCardProps {
  card: TabooCard;
}

export const GameCard: React.FC<GameCardProps> = ({ card }) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card 
        className="w-full max-w-md mx-auto shadow-xl"
        radius="lg"
      >
        <CardBody className="gap-4 p-6">
          <div className="text-center">
            <motion.h2 
              className="text-3xl font-bold text-primary mb-4"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {card.mainWord}
            </motion.h2>
            <Divider className="my-6" />
            <div className="space-y-3">
              {card.tabooWords.map((word, index) => (
                <motion.p
                  key={index}
                  className="text-xl font-medium text-danger"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  {word}
                </motion.p>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};
