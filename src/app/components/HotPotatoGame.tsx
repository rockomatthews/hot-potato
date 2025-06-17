'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGame } from '../contexts/GameContext';
import {
  Container,
  Typography,
  Grid,
  Box,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  EmojiEvents,
  SportsEsports,
  TrendingUp,
  Psychology,
} from '@mui/icons-material';
import Header from './Header';
import GameCard from './GameCard';

export default function HotPotatoGame() {
  const { connected } = useWallet();
  const { createGame, joinGame, getJoinableGames, getUserGames } = useGame();

  const userGames = getUserGames();
  const joinableGames = getJoinableGames();

  const handleCreateGame = (buyIn: number, maxPlayers: number) => {
    createGame(buyIn, maxPlayers);
  };

  const handleJoinGame = (gameId: string, buyIn: number) => {
    joinGame(gameId, buyIn);
  };

  if (!connected) {
    return (
      <>
        <Header onCreateGame={handleCreateGame} />
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Box 
            sx={{ 
              textAlign: 'center',
              py: 8,
              minHeight: '60vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FFB366 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3,
              }}
            >
              🔥 Welcome to Hot Potato 🔥
            </Typography>
            <Typography variant="h5" color="white" sx={{ opacity: 0.9, mb: 6, maxWidth: 600 }}>
              The ultimate high-stakes game where only one player loses and everyone else wins big!
            </Typography>
            
            <Grid container spacing={4} sx={{ maxWidth: 800, mb: 6 }}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <SportsEsports sx={{ fontSize: 48, color: '#FF6B35', mb: 2 }} />
                  <Typography variant="h6" color="white" gutterBottom>
                    Simple to Play
                  </Typography>
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                    Just buy in and wait for the table to fill up
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 48, color: '#FF8C42', mb: 2 }} />
                  <Typography variant="h6" color="white" gutterBottom>
                    High Rewards
                  </Typography>
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                    Winners split the loser&apos;s buy-in equally
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Psychology sx={{ fontSize: 48, color: '#FFB366', mb: 2 }} />
                  <Typography variant="h6" color="white" gutterBottom>
                    Pure Luck
                  </Typography>
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                    No skill required - it&apos;s all about timing!
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Card sx={{ 
              maxWidth: 600, 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" color="white" gutterBottom textAlign="center">
                  Connect your Phantom wallet to start playing!
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" textAlign="center">
                  Create your own games or join existing ones. The hot potato is waiting for you! 🥔
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header onCreateGame={handleCreateGame} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* User Games Section - Hero */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <EmojiEvents sx={{ fontSize: 40, color: '#FF6B35' }} />
              Your Games
            </Typography>
            <Typography variant="h6" color="rgba(255, 255, 255, 0.7)">
              Track your hot potato adventures
            </Typography>
          </Box>

          {userGames.length > 0 ? (
            <Grid container spacing={3}>
              {userGames.map((game) => (
                <Grid item xs={12} sm={6} lg={4} key={game.id}>
                  <GameCard 
                    game={game} 
                    isUserGame={true}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              py: 6,
            }}>
              <CardContent>
                <Typography variant="h6" color="white" gutterBottom>
                  No games yet! 🥔
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 3 }}>
                  Create your first hot potato game or join one from the marketplace below.
                </Typography>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: '#FF6B35',
                    color: '#FF6B35',
                    '&:hover': {
                      borderColor: '#FF8C42',
                      color: '#FF8C42',
                      backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    },
                  }}
                  onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                >
                  Browse Games Below
                </Button>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Marketplace Section */}
        <Box>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <SportsEsports sx={{ fontSize: 40, color: '#FF8C42' }} />
              Game Marketplace
            </Typography>
            <Typography variant="h6" color="rgba(255, 255, 255, 0.7)">
              Join a hot potato game and test your luck!
            </Typography>
          </Box>

          {joinableGames.length > 0 ? (
            <Grid container spacing={3}>
              {joinableGames.map((game) => (
                <Grid item xs={12} sm={6} lg={4} key={game.id}>
                  <GameCard 
                    game={game} 
                    onJoinGame={handleJoinGame}
                    isUserGame={false}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              py: 6,
            }}>
              <CardContent>
                <Typography variant="h6" color="white" gutterBottom>
                  No games available right now! 🕰️
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 3 }}>
                  Be the first to create a hot potato game and let others join the fun!
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.5)">
                  Click &quot;Create Game of Potato&quot; in the top-left corner to get started.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Statistics Banner */}
        <Box sx={{ mt: 8, mb: 4 }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 140, 66, 0.1) 50%, rgba(255, 179, 102, 0.1) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 107, 53, 0.3)',
          }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h5" color="white" gutterBottom sx={{ fontWeight: 'bold' }}>
                🔥 Ready to Play Hot Potato? 🔥
              </Typography>
              <Typography variant="body1" color="rgba(255, 255, 255, 0.8)" sx={{ mb: 2 }}>
                Create a game with your preferred buy-in amount and table size, or join an existing game!
              </Typography>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.6)">
                Remember: Only one player loses, everyone else wins! 🥔💰
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
} 