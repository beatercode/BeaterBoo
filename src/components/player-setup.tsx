import React from 'react';
import { Card, CardBody, Button, Input } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Player } from '../types/game';

interface PlayerSetupProps {
  onComplete: (team1Players: Player[], team2Players: Player[]) => void;
  onBack: () => void;
}

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onComplete, onBack }) => {
  const [team1Players, setTeam1Players] = React.useState<Player[]>([{ id: '1', name: '', team: 'team1' }]);
  const [team2Players, setTeam2Players] = React.useState<Player[]>([{ id: '1', name: '', team: 'team2' }]);

  const addPlayer = (team: 'team1' | 'team2') => {
    const newPlayer = { id: Date.now().toString(), name: '', team };
    if (team === 'team1') {
      setTeam1Players([...team1Players, newPlayer]);
    } else {
      setTeam2Players([...team2Players, newPlayer]);
    }
  };

  const updatePlayerName = (team: 'team1' | 'team2', id: string, name: string) => {
    if (team === 'team1') {
      setTeam1Players(team1Players.map(p => p.id === id ? { ...p, name } : p));
    } else {
      setTeam2Players(team2Players.map(p => p.id === id ? { ...p, name } : p));
    }
  };

  const handleSubmit = () => {
    const validTeam1 = team1Players.filter(p => p.name.trim());
    const validTeam2 = team2Players.filter(p => p.name.trim());
    onComplete(validTeam1, validTeam2);
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
            <h2 className="text-xl font-bold mb-4">Squadra 1</h2>
            {team1Players.map((player) => (
              <Input
                key={player.id}
                label={`Giocatore ${team1Players.indexOf(player) + 1}`}
                placeholder="Nome giocatore"
                value={player.name}
                onValueChange={(value) => updatePlayerName('team1', player.id, value)}
                className="mb-2"
              />
            ))}
            <Button
              size="sm"
              variant="flat"
              onPress={() => addPlayer('team1')}
              startContent={<Icon icon="lucide:plus" />}
            >
              Aggiungi Giocatore
            </Button>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Squadra 2</h2>
            {team2Players.map((player) => (
              <Input
                key={player.id}
                label={`Giocatore ${team2Players.indexOf(player) + 1}`}
                placeholder="Nome giocatore"
                value={player.name}
                onValueChange={(value) => updatePlayerName('team2', player.id, value)}
                className="mb-2"
              />
            ))}
            <Button
              size="sm"
              variant="flat"
              onPress={() => addPlayer('team2')}
              startContent={<Icon icon="lucide:plus" />}
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
          >
            Inizia Partita
          </Button>
        </CardBody>
      </Card>
    </motion.div>
  );
};
