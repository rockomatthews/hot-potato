'use client';

import React, { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function ClientOnlyWalletButton() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <button 
        className="wallet-adapter-button wallet-adapter-button-trigger" 
        style={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
      >
        Select Wallet
      </button>
    );
  }

  return <WalletMultiButton />;
} 