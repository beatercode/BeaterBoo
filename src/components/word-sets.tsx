import React from 'react';
import { Card, CardBody, Chip, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Slider, Progress } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { WordSet } from '../types/game';

interface WordSetsProps {
  wordSets: WordSet[];
  onSelectWordSet: (wordSet: WordSet) => void;
  onAddCardsToSet?: (wordSetId: string, onGenerationComplete: () => void) => void;
  onDeleteWordSet?: (wordSetId: string) => void;
  onBack?: () => void;
}

export const WordSets: React.FC<WordSetsProps> = ({
  wordSets,
  onSelectWordSet,
  onAddCardsToSet,
  onDeleteWordSet,
  onBack,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSet, setSelectedSet] = React.useState<WordSet | null>(null);
  const [cardsToAdd, setCardsToAdd] = React.useState(30);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationProgress, setGenerationProgress] = React.useState(0);
  
  // State per il modale di conferma eliminazione
  const { 
    isOpen: isDeleteModalOpen, 
    onOpen: openDeleteModal, 
    onClose: closeDeleteModal 
  } = useDisclosure();
  const [setToDelete, setSetToDelete] = React.useState<WordSet | null>(null);

  // Incrementa progressivamente la barra di progresso durante la generazione
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isGenerating && generationProgress < 95) {
      timer = setInterval(() => {
        setGenerationProgress(prev => {
          // Incremento progressivo che rallenta avvicinandosi al 95%
          const increment = Math.max(1, 10 * (1 - prev / 100));
          return Math.min(95, prev + increment);
        });
      }, 300);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isGenerating, generationProgress]);

  // L'evento è di tipo any perché può essere sia un MouseEvent che un PressEvent
  const handleOpenAddCardsModal = (wordSet: WordSet, e: any) => {
    // Ferma la propagazione se il metodo esiste
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    setSelectedSet(wordSet);
    setGenerationProgress(0);
    setIsGenerating(false);
    onOpen();
  };

  // Handler per aprire il modale di conferma eliminazione
  const handleOpenDeleteModal = (wordSet: WordSet, e: any) => {
    // Ferma la propagazione se il metodo esiste
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    setSetToDelete(wordSet);
    openDeleteModal();
  };

  // Handler per eliminare il set di parole
  const handleDeleteSet = () => {
    if (setToDelete && onDeleteWordSet) {
      onDeleteWordSet(setToDelete.id);
      closeDeleteModal();
    }
  };

  const handleAddCards = () => {
    if (selectedSet && onAddCardsToSet) {
      // Imposta lo stato di generazione
      setIsGenerating(true);
      
      // Chiama la funzione per aggiungere carte con callback
      onAddCardsToSet(selectedSet.id, () => {
        // Al termine della generazione
        setGenerationProgress(100);
        
        // Breve pausa prima di chiudere il modale
        setTimeout(() => {
          setIsGenerating(false);
          onClose();
        }, 500);
      });
    }
  };

  // L'evento è di tipo any perché può essere sia un MouseEvent che un PressEvent
  const handleCardClick = (wordSet: WordSet, e: any) => {
    // Verifica se il click proviene da un elemento con data-no-select
    if (e && e.target && (e.target as HTMLElement).closest('[data-no-select]')) {
      return;
    }
    onSelectWordSet(wordSet);
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
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Custom Decks</h2>
      </div>

      <div className="space-y-4">
        {wordSets.map((wordSet) => (
          <Card
            key={wordSet.id}
            className="w-full transition-all hover:shadow-lg hover:scale-[1.01] border border-primary-100/30 backdrop-blur-sm bg-content1/90"
            onPress={(e) => handleCardClick(wordSet, e)}
            isPressable
            tabIndex={0}
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
                  {wordSet.isCustom && (
                    <div className="flex gap-2" data-no-select>
                      {onAddCardsToSet && (
                        <Button 
                          size="sm" 
                          isIconOnly 
                          color="primary" 
                          variant="light"
                          onPress={(e) => handleOpenAddCardsModal(wordSet, e)}
                          className="hover:bg-primary-100/50"
                        >
                          <Icon icon="lucide:plus" className="text-primary" />
                        </Button>
                      )}
                      
                      {onDeleteWordSet && (
                        <Button 
                          size="sm" 
                          isIconOnly 
                          color="danger" 
                          variant="light"
                          onPress={(e) => handleOpenDeleteModal(wordSet, e)}
                          className="hover:bg-danger-100/50"
                        >
                          <Icon icon="lucide:trash-2" className="text-danger" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal isOpen={isOpen} onClose={isGenerating ? undefined : onClose} backdrop="blur" hideCloseButton={isGenerating}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Aggiungi parole al set
            </h3>
          </ModalHeader>
          <ModalBody>
            {!isGenerating ? (
              <>
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
              </>
            ) : (
              <div className="py-6 space-y-4">
                <h4 className="text-lg font-medium text-center">Generazione in corso...</h4>
                <Progress 
                  aria-label="Generazione in corso..." 
                  value={generationProgress} 
                  color="primary"
                  showValueLabel
                  className="max-w-md"
                />
                <p className="text-sm text-center text-default-500">
                  Stiamo generando {cardsToAdd} nuove parole per il set <strong>{selectedSet?.name}</strong>.
                  <br />Questo potrebbe richiedere alcuni secondi.
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {!isGenerating ? (
              <>
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
              </>
            ) : (
              <Button 
                variant="light" 
                isDisabled
                className="opacity-50"
              >
                Generazione in corso...
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modale di conferma eliminazione */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} backdrop="blur">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-danger">
              Elimina set
            </h3>
          </ModalHeader>
          <ModalBody>
            <p>Sei sicuro di voler eliminare il set <strong>{setToDelete?.name}</strong>?</p>
            <p className="text-sm text-default-500 mt-2">
              Questa azione è irreversibile e tutte le {setToDelete?.cards.length} parole del set verranno eliminate.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={closeDeleteModal}>
              Annulla
            </Button>
            <Button 
              color="danger" 
              onPress={handleDeleteSet}
              className="shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all"
            >
              Elimina
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </motion.div>
  );
};
