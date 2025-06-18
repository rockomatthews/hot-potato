'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as WinIcon,
  Home as HouseIcon,
  OpenInNew as ExternalIcon,
} from '@mui/icons-material';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGame } from '../contexts/GameContext';

interface Transaction {
  signature: string;
  type: 'buy_in' | 'winning' | 'house_fee';
  amount: number;
  gameId: string;
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
}

interface TransactionHistoryProps {
  open: boolean;
  onClose: () => void;
}

export default function TransactionHistory({ open, onClose }: TransactionHistoryProps) {
  const { publicKey } = useWallet();
  const { state } = useGame();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading] = useState(false);

  // Extract transactions from game history
  useEffect(() => {
    if (!publicKey || !open) return;

    const userAddress = publicKey.toString();
    const userTransactions: Transaction[] = [];

    // Get transactions from user's games
    state.games.forEach(game => {
      game.players.forEach(player => {
        if (player.publicKey === userAddress && player.transactionSignature) {
          userTransactions.push({
            signature: player.transactionSignature,
            type: 'buy_in',
            amount: player.buyIn,
            gameId: game.id,
            timestamp: game.createdAt,
            status: player.paymentConfirmed ? 'confirmed' : 'pending',
          });
        }
      });

      // Add winning transactions
      if (game.gameStatus === 'finished' && game.winner?.includes(userAddress)) {
        userTransactions.push({
          signature: `win-${game.id}`, // Placeholder signature for winnings
          type: 'winning',
          amount: game.totalPot / (game.winner.length || 1),
          gameId: game.id,
          timestamp: game.createdAt + 10000, // Approximate finish time
          status: 'confirmed',
        });
      }
    });

    // Sort by timestamp (newest first)
    userTransactions.sort((a, b) => b.timestamp - a.timestamp);
    setTransactions(userTransactions);
  }, [publicKey, state.games, open]);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'buy_in':
        return <WalletIcon sx={{ color: '#FF6B35' }} />;
      case 'winning':
        return <WinIcon sx={{ color: '#4ade80' }} />;
      case 'house_fee':
        return <HouseIcon sx={{ color: '#f59e0b' }} />;
      default:
        return <WalletIcon />;
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'buy_in':
        return '#ef4444';
      case 'winning':
        return '#4ade80';
      case 'house_fee':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getTransactionLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'buy_in':
        return 'Buy-in Payment';
      case 'winning':
        return 'Game Winnings';
      case 'house_fee':
        return 'House Fee';
      default:
        return 'Transaction';
    }
  };

  const openExplorer = (signature: string) => {
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const baseUrl = network === 'mainnet-beta' 
      ? 'https://explorer.solana.com'
      : 'https://explorer.solana.com/?cluster=devnet';
    
    if (!signature.startsWith('win-')) {
      window.open(`${baseUrl}/tx/${signature}`, '_blank');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(20, 20, 20, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 107, 53, 0.3)',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            📊 Transaction History
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress sx={{ color: '#FF6B35' }} />
          </Box>
        ) : transactions.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">
              No transactions found. Play some games to see your transaction history!
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {transactions.map((tx, index) => (
              <React.Fragment key={tx.signature}>
                <ListItem
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 2,
                    mb: 1,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <ListItemIcon>
                    {getTransactionIcon(tx.type)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                          {getTransactionLabel(tx.type)}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="body1"
                            sx={{
                              color: getTransactionColor(tx.type),
                              fontWeight: 600,
                            }}
                          >
                            {tx.type === 'buy_in' ? '-' : '+'}{tx.amount.toFixed(4)} SOL
                          </Typography>
                          {!tx.signature.startsWith('win-') && (
                            <IconButton
                              size="small"
                              onClick={() => openExplorer(tx.signature)}
                              sx={{ color: '#FF6B35' }}
                            >
                              <ExternalIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          Game: {tx.gameId.slice(0, 8)}...
                        </Typography>
                        <Box display="flex" gap={1} alignItems="center">
                          <Chip
                            label={tx.status}
                            size="small"
                            sx={{
                              backgroundColor: tx.status === 'confirmed' 
                                ? 'rgba(74, 222, 128, 0.2)' 
                                : 'rgba(251, 191, 36, 0.2)',
                              color: tx.status === 'confirmed' ? '#4ade80' : '#fbbf24',
                              border: `1px solid ${tx.status === 'confirmed' ? '#4ade80' : '#fbbf24'}`,
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < transactions.length - 1 && <Divider sx={{ my: 1 }} />}
              </React.Fragment>
            ))}
          </List>
        )}
        
        <Box mt={3} p={2} sx={{ 
          backgroundColor: 'rgba(255, 107, 53, 0.1)', 
          borderRadius: 2,
          border: '1px solid rgba(255, 107, 53, 0.3)'
        }}>
          <Typography variant="body2" sx={{ color: '#FFB366', mb: 1 }}>
            💡 <strong>Transparency Note:</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            All transactions are recorded on the Solana blockchain. Buy-in payments go to secure escrow accounts, 
            and winnings are automatically distributed when games end. House fees (3%) support platform operations.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
} 