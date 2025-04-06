import React from 'react';
import { Card, CardBody, Chip, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Slider } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { WordSet } from '../types/game';

interface WordSetsProps {
  wordSets: WordSet[];
  onSelectWordSet: (wordSet: WordSet) => void;
  onAddCardsToSet?: (wordSetId: string, count: number) => void;
  onBack?: () => void;
}

export const WordSets: React.FC<WordSetsProps> = ({
  wordSets,
  onSelectWordSet,
  onAddCardsToSet,
  onBack,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSet, setSelectedSet] = React.useState<WordSet | null>(null);
  const [cardsToAdd, setCardsToAdd] = React.useState(30);

  const handleOpenAddCardsModal = (wordSet: WordSet, e: unknown) => {
    // Convert to any known event type that has stopPropagation
    const event = e as { stopPropagation: () => void };
    if (event.stopPropagation) {
      event.stopPropagation(); // Prevent triggering card click
    }
    setSelectedSet(wordSet);
    onOpen();
  };

  const handleAddCards = () => {
    if (selectedSet && onAddCardsToSet) {
      onAddCardsToSet(selectedSet.id, cardsToAdd);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="w-full max-w-md mx-auto space-y-4 pb-20"
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
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Set di Parole</h2>
      </div>

      <div className="space-y-4">
        {wordSets.map((wordSet) => (
          <Card
            key={wordSet.id}
            isPressable
            onPress={() => onSelectWordSet(wordSet)}
            className="w-full transition-all hover:shadow-lg hover:scale-[1.01] border border-primary-100/30 backdrop-blur-sm bg-content1/90"
          >
            <CardBody className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{wordSet.name}</h3>
                  <p className="text-sm text-default-500">{wordSet.description}</p>
                </div>
                {wordSet.isCustom && (
                  <Chip color="primary" variant="flat" size="sm" className="animate-pulse">
                    Personalizzato
                  </Chip>
                )}
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-default-400">
                  {wordSet.cards.length} parole
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-default-400">
                    {new Date(wordSet.createdAt).toLocaleDateString()}
                  </span>
                  {wordSet.isCustom && onAddCardsToSet && (
                    <Button 
                      size="sm" 
                      isIconOnly 
                      color="primary" 
                      variant="light"
                      onPress={(e) => handleOpenAddCardsModal(wordSet, e)}
                      className="ml-2 hover:bg-primary-100/50"
                    >
                      <Icon icon="lucide:plus" className="text-primary" />
                    </Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal isOpen={isOpen} onClose={onClose} backdrop="blur">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Aggiungi parole al set
            </h3>
          </ModalHeader>
          <ModalBody>
            <p>Seleziona quante nuove carte vuoi aggiungere a <strong>{selectedSet?.name}</strong>:</p>
            
            <div className="py-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Carte da aggiungere:</span>
                <span className="font-semibold">{cardsToAdd}</span>
              </div>
              <Slider
                aria-label="Carte da aggiungere"
                step={10}
                minValue={10}
                maxValue={100}
                value={cardsToAdd}
                onChange={setCardsToAdd as any}
                className="my-1"
                marks={[
                  { value: 10, label: "10" },
                  { value: 50, label: "50" },
                  { value: 100, label: "100" },
                ]}
                classNames={{
                  track: "bg-primary-200",
                  filler: "bg-primary",
                }}
              />
            </div>
            
            <p className="text-sm text-default-500">
              Le nuove parole verranno generate automaticamente ed eviteranno duplicati con le parole già presenti nel set.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Annulla
            </Button>
            <Button 
              color="primary" 
              onPress={handleAddCards}
              className="shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all"
            >
              Aggiungi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </motion.div>
  );
};
