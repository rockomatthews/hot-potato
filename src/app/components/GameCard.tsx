'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
  AvatarGroup,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  LocalFireDepartment,
  EmojiEvents,
  PersonAdd,
  Casino,
  AccessTime,
  Groups,
} from '@mui/icons-material';
import { Game } from '../contexts/GameContext';

interface GameCardProps {
  game: Game;
  onJoinGame?: (gameId: string, buyIn: number) => Promise<void>;
  onLeaveGame?: (gameId: string) => Promise<void>;
  isUserGame?: boolean;
  walletBalance?: number;
  paymentLoading?: boolean;
}

export default function GameCard({ game, onJoinGame, onLeaveGame, isUserGame = false, walletBalance = 0, paymentLoading = false }: GameCardProps) {
  const { connected, publicKey } = useWallet();
  
  const isUserInGame = publicKey && game.players.some(p => p.publicKey === publicKey.toString());
  const isUserWinner = publicKey && game.winner?.includes(publicKey.toString());
  const isUserLoser = publicKey && game.loser === publicKey.toString();
  const winningsPerPlayer = game.gameStatus === 'finished' && game.winner ? 
    game.totalPot / game.winner.length : 0;
  
  // Calculate expected winnings if game were to finish now
  const expectedWinningsPerPlayer = game.players.length > 1 ? 
    game.totalPot / (game.players.length - 1) : 0;

  const getStatusColor = () => {
    switch (game.gameStatus) {
      case 'waiting': return '#4ECDC4';
      case 'full': return '#FFB366';
      case 'playing': return '#FF6B35';
      case 'finished': return '#26D0CE';
      default: return '#666';
    }
  };

  const getStatusText = () => {
    switch (game.gameStatus) {
      case 'waiting': return `${game.players.length}/${game.maxPlayers} Players`;
      case 'full': return 'Starting Soon...';
      case 'playing': return '🔥 In Progress 🔥';
      case 'finished': return 'Finished';
      default: return 'Unknown';
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleJoinGame = async () => {
    if (onJoinGame && connected) {
      await onJoinGame(game.id, game.buyInAmount);
    }
  };

  const handleLeaveGame = async () => {
    if (onLeaveGame && connected) {
      await onLeaveGame(game.id);
    }
  };

  const hasInsufficientBalance = walletBalance < game.buyInAmount;

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: isUserGame 
          ? 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(247, 147, 30, 0.1) 100%)'
          : 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: isUserGame 
          ? '2px solid rgba(255, 107, 53, 0.3)'
          : '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
              {game.name || `Game #${game.id}`}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {formatTimeAgo(game.createdAt)}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={getStatusText()}
            sx={{
              backgroundColor: getStatusColor(),
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Box>

        {/* Game Info */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Casino sx={{ color: '#ff6b35' }} />
              <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
                {game.buyInAmount} SOL
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Groups sx={{ color: 'text.secondary' }} />
              <Typography variant="body1" color="text.secondary">
                {game.maxPlayers} seats
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Pot
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {game.totalPot.toFixed(3)} SOL
              </Typography>
            </Box>
            {game.gameStatus === 'waiting' && game.players.length > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="rgba(255, 179, 102, 0.8)" sx={{ fontSize: '0.75rem' }}>
                  Potential Winnings
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#FFB366', fontSize: '0.75rem' }}>
                  {expectedWinningsPerPlayer.toFixed(3)} SOL each
                </Typography>
              </Box>
            )}
            <LinearProgress
              variant="determinate"
              value={(game.players.length / game.maxPlayers) * 100}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#ff6b35',
                  borderRadius: 4,
                },
              }}
            />
          </Box>
        </Box>

        {/* Players */}
        {game.players.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Players ({game.players.length}/{game.maxPlayers})
            </Typography>
            <AvatarGroup max={6} sx={{ justifyContent: 'flex-start' }}>
              {game.players.map((player) => (
                <Avatar
                  key={player.publicKey}
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: '12px',
                    backgroundColor: player.publicKey === publicKey?.toString() 
                      ? '#FF6B35' 
                      : 'rgba(255, 255, 255, 0.2)',
                    border: '2px solid rgba(255, 107, 53, 0.3)',
                  }}
                >
                  {player.address.slice(0, 2)}
                </Avatar>
              ))}
            </AvatarGroup>
          </Box>
        )}

        {/* Game Status Specific Content */}
        {game.gameStatus === 'playing' && isUserInGame && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 2,
              backgroundColor: 'rgba(255, 152, 0, 0.2)',
              color: 'white',
              '& .MuiAlert-icon': { color: 'white' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={16} sx={{ color: 'white' }} />
              <Typography variant="body2">
                Hot potato is being passed! 🔥
              </Typography>
            </Box>
          </Alert>
        )}

        {game.gameStatus === 'finished' && isUserInGame && (
          <Box sx={{ mb: 2 }}>
            {isUserWinner && (
              <Alert severity="success" sx={{ mb: 2, backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  🎉 You Won {winningsPerPlayer.toFixed(4)} SOL! 🎉
                </Typography>
              </Alert>
            )}
            {isUserLoser && (
              <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(244, 67, 54, 0.2)' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  💀 You Lost! Better luck next time! 💀
                </Typography>
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ 
                flex: 1, 
                p: 1.5, 
                backgroundColor: 'rgba(244, 67, 54, 0.2)', 
                borderRadius: 2,
                textAlign: 'center'
              }}>
                <LocalFireDepartment sx={{ color: '#f44336', mb: 0.5 }} />
                <Typography variant="caption" color="text.secondary" display="block">
                  Loser
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {game.players.find(p => p.publicKey === game.loser)?.address || 'Unknown'}
                </Typography>
              </Box>
              
              <Box sx={{ 
                flex: 1, 
                p: 1.5, 
                backgroundColor: 'rgba(76, 175, 80, 0.2)', 
                borderRadius: 2,
                textAlign: 'center'
              }}>
                <EmojiEvents sx={{ color: '#4caf50', mb: 0.5 }} />
                <Typography variant="caption" color="text.secondary" display="block">
                  Winners
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {game.winner?.length || 0} players
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>

      {/* Action Buttons */}
      {game.gameStatus === 'waiting' && !isUserInGame && onJoinGame && (
        <Box sx={{ p: 3, pt: 0 }}>
          {hasInsufficientBalance && (
            <Typography variant="body2" color="error" sx={{ mb: 1, textAlign: 'center' }}>
              ⚠️ Insufficient balance ({walletBalance.toFixed(3)} SOL)
            </Typography>
          )}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleJoinGame}
            disabled={!connected || paymentLoading || hasInsufficientBalance}
            startIcon={paymentLoading ? <CircularProgress size={20} /> : <PersonAdd />}
            sx={{
              backgroundColor: '#ff6b35',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#ff5722',
              },
              '&:disabled': {
                backgroundColor: 'rgba(255, 107, 53, 0.3)',
                color: 'rgba(255, 255, 255, 0.5)',
              },
              borderRadius: '12px',
              py: 1.5,
            }}
          >
            {paymentLoading ? 'Processing Payment...' : `Join for ${game.buyInAmount} SOL`}
          </Button>
        </Box>
      )}

      {/* Leave Game Button for users already in the game */}
      {game.gameStatus === 'waiting' && isUserInGame && onLeaveGame && (
        <Box sx={{ p: 3, pt: 0 }}>
          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={handleLeaveGame}
            disabled={!connected || paymentLoading}
            sx={{
              borderColor: '#ff5722',
              color: '#ff5722',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'rgba(255, 87, 34, 0.1)',
                borderColor: '#ff5722',
              },
              '&:disabled': {
                borderColor: 'rgba(255, 87, 34, 0.3)',
                color: 'rgba(255, 87, 34, 0.5)',
              },
              borderRadius: '12px',
              py: 1.5,
            }}
          >
            👋 Leave Game
          </Button>
        </Box>
      )}
    </Card>
  );
} 