import React from 'react';
import { Card, CardBody, Button, Input, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { TabooCard } from '../types/game';
import { generateTabooWords } from '../services/gemini';

interface WordSetGeneratorProps {
  onComplete: (cards: TabooCard[]) => void;
  onBack: () => void;
}

export const WordSetGenerator: React.FC<WordSetGeneratorProps> = ({ onComplete, onBack }) => {
  const [topic, setTopic] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  
  const generateWords = async () => {
    setIsGenerating(true);
    try {
      const cards = await generateTabooWords(topic);
      onComplete(cards);
      // Success message handled in parent component
    } catch (error) {
      console.error('Error generating words:', error);
      // Just log the error instead of using toast
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="w-full max-w-md mx-auto space-y-4"
    >
      <Button
        variant="light"
        startContent={<Icon icon="lucide:arrow-left" />}
        onPress={onBack}
      >
        Indietro
      </Button>

      <Card className="shadow-lg">
        <CardBody className="space-y-4">
          <h2 className="text-xl font-bold">Genera Set di Parole</h2>
          <Input
            label="Tema (opzionale)"
            placeholder="Es: Sport, Cibo, Cinema..."
            value={topic}
            onValueChange={setTopic}
            description="Lascia vuoto per parole da categorie miste"
          />
          <Button
            color="primary"
            size="lg"
            className="w-full"
            onPress={generateWords}
            isDisabled={isGenerating}
            startContent={isGenerating ? <Spinner size="sm" /> : <Icon icon="lucide:sparkles" />}
          >
            {isGenerating ? 'Generazione in corso...' : 'Genera Parole'}
          </Button>
        </CardBody>
      </Card>

      <p className="text-center text-small text-default-500">
        Verranno generate 5 carte con parole in italiano
      </p>
    </motion.div>
  );
};
