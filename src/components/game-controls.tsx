import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface GameControlsProps {
  onCorrect: () => void;
  onSkip: () => void;
  onEndTurn: () => void;
  isPlaying: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onCorrect,
  onSkip,
  onEndTurn,
  isPlaying
}) => {
  if (!isPlaying) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-content1 shadow-lg" style={{ zIndex: 60 }}>
      <div className="flex justify-between gap-2 max-w-md mx-auto">
        <Button
          color="success"
          className="flex-1"
          onPress={onCorrect}
          startContent={<Icon icon="lucide:check" />}
        >
          Correct
        </Button>
        <Button
          color="warning"
          className="flex-1"
          onPress={onSkip}
          startContent={<Icon icon="lucide:skip-forward" />}
        >
          Skip
        </Button>
        <Button
          color="danger"
          className="flex-1"
          onPress={onEndTurn}
          startContent={<Icon icon="lucide:x" />}
        >
          End Turn
        </Button>
      </div>
    </div>
  );
};
