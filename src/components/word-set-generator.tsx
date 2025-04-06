import React from 'react';
import { Button, Input, Progress, Slider } from '@heroui/react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { TabooCard } from '../types/game';
import { generateTabooWords } from '../services/gemini';

interface WordSetGeneratorProps {
  onComplete: (cards: TabooCard[]) => void;
  onBack?: () => void;
  existingWords?: string[] | (() => string[]);
  initialCardCount?: number;
}

export const WordSetGenerator: React.FC<WordSetGeneratorProps> = ({ 
  onComplete, 
  onBack,
  existingWords = [],
  initialCardCount = 30
}) => {
  const [topic, setTopic] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [cardCount, setCardCount] = React.useState(initialCardCount);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [generatedCards, setGeneratedCards] = React.useState<TabooCard[]>([]);

  const existingWordsArray = typeof existingWords === 'function' ? existingWords() : existingWords;

  const generateWords = async () => {
    if (!topic && !category) return;
    
    setIsGenerating(true);
    setProgress(0);
    setGeneratedCards([]);
    
    const batchSize = 30;
    const totalBatches = Math.ceil(cardCount / batchSize);
    let allCards: TabooCard[] = [];
    
    try {
      for (let i = 0; i < totalBatches; i++) {
        const remaining = cardCount - (i * batchSize);
        const currentBatchSize = Math.min(remaining, batchSize);
        
        // Raccogli tutte le parole esistenti e quelle già generate
        const wordsToAvoid = [
          ...existingWordsArray,
          ...allCards.map(card => card.mainWord)
        ];
        
        // Chiamata aggiornata alla funzione generateTabooWords con la nuova firma
        const newCards = await generateTabooWords(
          topic,
          category,
          currentBatchSize,
          wordsToAvoid
        );
        
        allCards = [...allCards, ...newCards];
        const newProgress = Math.min(((i + 1) / totalBatches) * 100, 100);
        setProgress(newProgress);
        setGeneratedCards(allCards);
      }
      
      onComplete(allCards);
    } catch (error) {
      console.error('Errore nella generazione delle parole:', error);
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="w-full max-w-md mx-auto space-y-6"
    >
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="light"
          startContent={<Icon icon="lucide:arrow-left" />}
          onPress={onBack}
          className="hover:bg-primary-50 transition-colors"
        >
          Indietro
        </Button>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Genera Parole</h2>
      </div>

      <div className="space-y-4">
        <Input
          label="Argomento (opzionale)"
          placeholder="Es. Cucina italiana, Sport, Animali..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full"
          isDisabled={isGenerating}
        />
        
        <Input
          label="Categoria (opzionale)"
          placeholder="Es. Facile, Medio, Difficile..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full"
          isDisabled={isGenerating}
        />
        
        <div className="py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Numero di carte da generare:</span>
            <span className="font-semibold">{cardCount}</span>
          </div>
          <Slider
            aria-label="Numero di carte"
            step={10}
            minValue={10}
            maxValue={150}
            value={cardCount}
            onChange={setCardCount as any}
            className="my-1"
            marks={[
              { value: 10, label: "10" },
              { value: 50, label: "50" },
              { value: 100, label: "100" },
              { value: 150, label: "150" },
            ]}
            classNames={{
              track: "bg-primary-200",
              filler: "bg-primary",
            }}
            isDisabled={isGenerating}
          />
          {existingWordsArray.length > 0 && (
            <p className="text-xs text-default-400 mt-2">
              Eviteremo duplicati con le {existingWordsArray.length} parole esistenti.
            </p>
          )}
        </div>
        
        {isGenerating && (
          <div className="space-y-2">
            <Progress
              aria-label="Generazione in corso..."
              value={progress}
              className="max-w-md"
              color="primary"
              showValueLabel
            />
            <p className="text-sm text-center text-default-500">
              {generatedCards.length} parole generate su {cardCount}
            </p>
          </div>
        )}
        
        <Button
          color="primary"
          className="w-full mt-4 shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all"
          onPress={generateWords}
          isDisabled={isGenerating}
          startContent={!isGenerating && <Icon icon="lucide:wand-sparkles" />}
        >
          {isGenerating ? 'Generazione in corso...' : 'Genera Parole'}
        </Button>
      </div>
    </motion.div>
  );
};
