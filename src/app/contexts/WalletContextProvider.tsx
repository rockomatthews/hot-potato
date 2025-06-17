'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

export default function WalletContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  // Use environment variable to switch between networks
  const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Devnet;

  // RPC endpoint configuration with QuickNode support
  const endpoint = useMemo(() => {
    const customEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT;
    
    if (customEndpoint) {
      console.log('🚀 Using custom RPC endpoint:', customEndpoint.includes('quiknode') ? 'QuickNode' : 'Custom RPC');
      return customEndpoint;
    }
    
    console.log('🌐 Using default Solana RPC for network:', network);
    return clusterApiUrl(network);
  }, [network]);

  // Log configuration on startup
  useMemo(() => {
    console.log('🔥 Hot Potato - Wallet Configuration:');
    console.log('📡 Network:', network);
    console.log('🏠 House wallet:', process.env.NEXT_PUBLIC_HOUSE_WALLET_ADDRESS || 'Not configured');
    console.log('💰 House fee:', process.env.NEXT_PUBLIC_HOUSE_FEE_PERCENTAGE || '3%');
  }, [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 