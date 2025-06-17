'use client';

import React from 'react';
import WalletContextProvider from '../contexts/WalletContextProvider';
import { GameContextProvider } from '../contexts/GameContext';
import CustomThemeProvider from './ThemeProvider';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomThemeProvider>
      <WalletContextProvider>
        <GameContextProvider>
          {children}
        </GameContextProvider>
      </WalletContextProvider>
    </CustomThemeProvider>
  );
} 