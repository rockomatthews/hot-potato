'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGame } from '../contexts/GameContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import { Add, AccountBalanceWallet } from '@mui/icons-material';
import ClientOnlyWalletButton from './ClientOnlyWalletButton';
import Image from 'next/image';

interface HeaderProps {
  onCreateGame: (buyIn: number, maxPlayers: number) => void;
}

export default function Header({ onCreateGame }: HeaderProps) {
  const { connected, publicKey } = useWallet();
  const { getHouseFeeInfo } = useGame();
  const [createGameOpen, setCreateGameOpen] = useState(false);
  const [buyIn, setBuyIn] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(5);
  
  const houseFeeInfo = getHouseFeeInfo();

  const handleCreateGame = () => {
    onCreateGame(buyIn, maxPlayers);
    setCreateGameOpen(false);
    setBuyIn(1);
    setMaxPlayers(5);
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <>
      <AppBar 
        position="sticky" 
        sx={{ 
          backgroundColor: 'rgba(20, 20, 20, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 107, 53, 0.2)',
          boxShadow: '0 4px 20px rgba(255, 107, 53, 0.1)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          {/* Left side - Create Game Button */}
          <Box>
            {connected && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateGameOpen(true)}
                sx={{
                  background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FF9A56 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #E5502A 0%, #E6732F 50%, #E67E3A 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(255, 107, 53, 0.4)',
                  },
                  borderRadius: '12px',
                  textTransform: 'none',
                  px: 3,
                  py: 1.5,
                  transition: 'all 0.3s ease',
                }}
              >
                Create Game of Potato
              </Button>
            )}
          </Box>

          {/* Center - Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                position: 'relative',
                width: 60,
                height: 60,
                filter: 'drop-shadow(0 4px 10px rgba(255, 107, 53, 0.3))',
              }}
            >
              <Image
                src="/logo-potato.png"
                alt="Hot Potato Logo"
                width={60}
                height={60}
                style={{
                  objectFit: 'contain',
                }}
                priority
              />
            </Box>
            <Typography 
              variant="h4" 
              component="div" 
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 30%, #FF9A56 60%, #FFB366 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(255, 107, 53, 0.3)',
                letterSpacing: '-0.5px',
              }}
            >
              HOT POTATO
            </Typography>
          </Box>

          {/* Right side - Wallet Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {connected && publicKey ? (
              <Chip
                icon={<AccountBalanceWallet />}
                label={formatWalletAddress(publicKey.toString())}
                variant="outlined"
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 107, 53, 0.4)',
                  backgroundColor: 'rgba(255, 107, 53, 0.1)',
                  backdropFilter: 'blur(10px)',
                  '& .MuiChip-icon': {
                    color: '#FF8C42',
                  },
                  '&:hover': {
                    borderColor: 'rgba(255, 107, 53, 0.6)',
                    backgroundColor: 'rgba(255, 107, 53, 0.2)',
                  },
                  transition: 'all 0.3s ease',
                }}
              />
            ) : (
              <Box sx={{ '& .wallet-adapter-button': { 
                background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%) !important', 
                color: 'white !important',
                borderRadius: '12px !important',
                border: 'none !important',
                fontWeight: '600 !important',
                padding: '12px 24px !important',
                transition: 'all 0.3s ease !important',
                '&:hover': {
                  background: 'linear-gradient(135deg, #E5502A 0%, #E6732F 100%) !important',
                  transform: 'translateY(-2px) !important',
                  boxShadow: '0 8px 25px rgba(255, 107, 53, 0.4) !important',
                }
              }}}>
                <ClientOnlyWalletButton />
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Create Game Dialog */}
      <Dialog 
        open={createGameOpen} 
        onClose={() => setCreateGameOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(20, 20, 20, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 107, 53, 0.3)',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 107, 53, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', textAlign: 'center', pb: 2 }}>
          <Typography variant="h4" component="div" gutterBottom sx={{
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FF9A56 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
          }}>
            🥔 Create New Potato Game 🥔
          </Typography>
          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
            Set your buy-in and table size
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              fullWidth
              label="Buy-in Amount (SOL)"
              type="number"
              value={buyIn}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuyIn(Number(e.target.value))}
              InputProps={{ inputProps: { min: 0.1, step: 0.1 } }}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 107, 53, 0.05)',
                  borderRadius: '12px',
                  '& fieldset': {
                    borderColor: 'rgba(255, 107, 53, 0.3)',
                    borderWidth: '2px',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 107, 53, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FF8C42',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#FF8C42',
                  },
                },
                '& input': {
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                },
              }}
            />

            <TextField
              fullWidth
              select
              label="Seats Around the Table"
              value={maxPlayers}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxPlayers(Number(e.target.value))}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 107, 53, 0.05)',
                  borderRadius: '12px',
                  '& fieldset': {
                    borderColor: 'rgba(255, 107, 53, 0.3)',
                    borderWidth: '2px',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 107, 53, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FF8C42',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#FF8C42',
                  },
                },
                '& .MuiSelect-select': {
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                },
              }}
            >
              {[3, 4, 5, 6, 7, 8, 10, 12].map((num) => (
                <MenuItem key={num} value={num} sx={{ 
                  backgroundColor: 'rgba(20, 20, 20, 0.9)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 107, 53, 0.2)',
                  },
                }}>
                  {num} players
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 140, 66, 0.05) 100%)', 
              borderRadius: '16px',
              border: '2px solid rgba(255, 107, 53, 0.2)',
              backdropFilter: 'blur(10px)',
            }}>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.8)" sx={{ mb: 1, fontWeight: '600' }}>
                💡 <strong>How it works:</strong>
              </Typography>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ lineHeight: 1.6 }}>
                Everyone puts in <strong style={{ color: '#FF8C42' }}>{buyIn} SOL</strong>. When {maxPlayers} players join, the hot potato starts! 
                One unlucky player loses everything, and the other <strong style={{ color: '#FF8C42' }}>{maxPlayers - 1} players</strong> split the pot equally.
              </Typography>
              <Typography variant="body2" color="rgba(255, 179, 102, 0.8)" sx={{ mt: 1, fontSize: '0.8rem' }}>
                💰 <strong>House fee:</strong> {(houseFeeInfo.percentage * 100).toFixed(1)}% ({(buyIn * houseFeeInfo.percentage).toFixed(3)} SOL) • 
                <strong> Winners split:</strong> {(buyIn * (1 - houseFeeInfo.percentage) * maxPlayers / (maxPlayers - 1)).toFixed(3)} SOL each
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
          <Button 
            onClick={() => setCreateGameOpen(false)}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '12px',
              px: 3,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateGame}
            disabled={buyIn <= 0}
            sx={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FF9A56 100%)',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': {
                background: 'linear-gradient(135deg, #E5502A 0%, #E6732F 50%, #E67E3A 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(255, 107, 53, 0.4)',
              },
              '&:disabled': {
                background: 'rgba(255, 107, 53, 0.3)',
                color: 'rgba(255, 255, 255, 0.5)',
              },
              borderRadius: '12px',
              px: 4,
              py: 1.5,
              transition: 'all 0.3s ease',
            }}
          >
            Create Game
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 