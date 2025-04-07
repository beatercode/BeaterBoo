import React from 'react';
import { Navbar, NavbarContent, NavbarItem, Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { GamePhase } from '../types/game';

interface BottomNavProps {
  currentPhase: GamePhase;
  onNavigate: (phase: GamePhase) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPhase, onNavigate }) => {
  return (
    <Navbar
      className="fixed bottom-0 left-0 right-0 h-16 border-t border-divider bg-background/70 backdrop-blur-md z-50"
      maxWidth="full"
      isBordered
      style={{ 
        bottom: '0px !important', 
        top: 'auto !important', 
        position: 'fixed !important' as any
      }}
    >
      <NavbarContent className="max-w-md mx-auto flex justify-around w-full" justify="center">
        <NavbarItem>
          <Button
            variant={currentPhase === 'menu' ? 'solid' : 'light'}
            color={currentPhase === 'menu' ? 'primary' : 'default'}
            onPress={() => onNavigate('menu')}
            isIconOnly
            startContent={<Icon icon="lucide:home" className="text-xl" />}
          />
        </NavbarItem>
        <NavbarItem>
          <Button
            variant={currentPhase === 'wordSets' ? 'solid' : 'light'}
            color={currentPhase === 'wordSets' ? 'primary' : 'default'}
            onPress={() => onNavigate('wordSets')}
            isIconOnly
            startContent={<Icon icon="lucide:library" className="text-xl" />}
          />
        </NavbarItem>
        <NavbarItem>
          <Button
            variant={currentPhase === 'wordSetGeneration' ? 'solid' : 'light'}
            color={currentPhase === 'wordSetGeneration' ? 'primary' : 'default'}
            onPress={() => onNavigate('wordSetGeneration')}
            isIconOnly
            startContent={<Icon icon="lucide:sparkles" className="text-xl" />}
          />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};
