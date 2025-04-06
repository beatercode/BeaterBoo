import React, { useEffect } from 'react';
import { Card, CardBody, Button, Input } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Player } from '../types/game';

interface PlayerSetupProps {
  onComplete: (players: Player[]) => void;
  onBack: () => void;
}

const STORAGE_KEY = 'taboo-player-setup';

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onComplete, onBack }) => {
  const [players, setPlayers] = React.useState<Player[]>([
    { id: '1', name: '' }
  ]);

  // Carica i giocatori dal localStorage all'avvio
  useEffect(() => {
    const savedPlayers = localStorage.getItem(STORAGE_KEY);
    if (savedPlayers) {
      try {
        const parsedPlayers = JSON.parse(savedPlayers);
        if (Array.isArray(parsedPlayers) && parsedPlayers.length > 0) {
          setPlayers(parsedPlayers);
        }
      } catch (e) {
        console.error('Errore nel parsing dei giocatori salvati:', e);
      }
    }
  }, []);

  const addPlayer = () => {
    const newPlayer = { id: Date.now().toString(), name: '' };
    setPlayers([...players, newPlayer]);
  };

  const removePlayer = (id: string) => {
    if (players.length > 1) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const updatePlayerName = (id: string, name: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
  };

  const handleSubmit = () => {
    const validPlayers = players.filter(p => p.name.trim());
    
    // Salva i giocatori nel localStorage per uso futuro
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validPlayers));
    
    // Passa i giocatori validi al componente genitore
    onComplete(validPlayers);
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

      <Card>
        <CardBody className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Giocatori</h2>
            <p className="text-sm text-default-500 mb-4">
              Ogni giocatore gioca individualmente, a turno.
            </p>
            
            {players.map((player, index) => (
              <div key={player.id} className="flex items-center gap-2 mb-2">
                <Input
                  label={`Giocatore ${index + 1}`}
                  placeholder="Nome giocatore"
                  value={player.name}
                  onValueChange={(value) => updatePlayerName(player.id, value)}
                  className="flex-grow"
                />
                <Button
                  size="sm"
                  isIconOnly
                  color="danger"
                  variant="light"
                  onPress={() => removePlayer(player.id)}
                  disabled={players.length <= 1}
                  className="mt-5"
                >
                  <Icon icon="lucide:x" />
                </Button>
              </div>
            ))}
            
            <Button
              size="sm"
              variant="flat"
              onPress={addPlayer}
              startContent={<Icon icon="lucide:plus" />}
              className="mt-2"
            >
              Aggiungi Giocatore
            </Button>
          </div>

          <Button
            color="primary"
            size="lg"
            className="w-full"
            onPress={handleSubmit}
            startContent={<Icon icon="lucide:check" />}
            isDisabled={players.filter(p => p.name.trim()).length < 1}
          >
            Inizia Partita
          </Button>
        </CardBody>
      </Card>
    </motion.div>
  );
};
