'use client';

import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { Circle, Speed, Security } from '@mui/icons-material';

export default function NetworkIndicator() {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  const isMainnet = network === 'mainnet-beta';
  const isQuickNode = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT?.includes('quiknode');

  const getNetworkColor = () => {
    switch (network) {
      case 'mainnet-beta': return '#26D0CE';
      case 'testnet': return '#FFB366';
      case 'devnet': return '#FF6B35';
      default: return '#666';
    }
  };

  const getNetworkIcon = () => {
    if (isMainnet) {
      return isQuickNode ? <Speed sx={{ fontSize: 16 }} /> : <Security sx={{ fontSize: 16 }} />;
    }
    return <Circle sx={{ fontSize: 16 }} />;
  };



  const getTooltipText = () => {
    if (isMainnet) {
      return isQuickNode 
        ? 'Running on Solana Mainnet with QuickNode RPC for optimal performance'
        : 'Running on Solana Mainnet with default RPC';
    }
    return `Running on Solana ${network} - not real SOL`;
  };

  return (
    <Tooltip title={getTooltipText()} arrow>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: isMainnet ? 'rgba(38, 208, 206, 0.15)' : 'rgba(255, 107, 53, 0.15)',
          border: `2px solid ${getNetworkColor()}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: getNetworkColor(),
          animation: isMainnet ? 'pulse 2s infinite' : 'none',
          '@keyframes pulse': {
            '0%': {
              boxShadow: `0 0 0 0 ${getNetworkColor()}40`,
            },
            '70%': {
              boxShadow: `0 0 0 4px ${getNetworkColor()}00`,
            },
            '100%': {
              boxShadow: `0 0 0 0 ${getNetworkColor()}00`,
            },
          },
        }}
      >
        {getNetworkIcon()}
      </Box>
    </Tooltip>
  );
} 