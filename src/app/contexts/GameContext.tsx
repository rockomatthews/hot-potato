'use client';

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import toast from 'react-hot-toast';
import { PublicKey, Keypair } from '@solana/web3.js';
import { 
  getSolanaConnection, 
  createEscrowDepositTransaction, 
  createWinningDistributionTransaction,
  solToLamports, 
  getWalletBalance,
  generateGameEscrowAccount,
  calculateGamePayouts,
  sendAndConfirmTransaction
} from '@/lib/solana';
// Database functions are now handled via API routes

// House configuration
const HOUSE_FEE_PERCENTAGE = parseFloat(process.env.NEXT_PUBLIC_HOUSE_FEE_PERCENTAGE || '0.03');
const HOUSE_WALLET_ADDRESS = process.env.NEXT_PUBLIC_HOUSE_WALLET_ADDRESS || "CHyQpdkGgoQbQDdm9vgjc3NpiBQ9wQ8Fu8LHQaPwoNdN";

export interface Player {
  publicKey: string;
  buyIn: number;
  address: string;
  transactionSignature?: string; // Track payment transaction
  paymentConfirmed: boolean;
}

export interface Game {
  id: string;
  name: string; // Game name set by creator
  players: Player[];
  gameStatus: 'waiting' | 'full' | 'playing' | 'finished';
  maxPlayers: number;
  minPlayers: number;
  buyInAmount: number;
  winner?: string[];
  loser?: string;
  totalPot: number;
  houseFeeCollected: number;
  createdBy: string;
  createdAt: number;
  escrowAccount?: {
    publicKey: string;
    secretKey: number[]; // Store for distribution later
  };
  paymentStatus: 'pending' | 'collecting' | 'complete' | 'failed';
}

export interface GameState {
  games: Game[];
  userGames: Game[];
}

type GameAction =
  | { type: 'CREATE_GAME'; payload: { game: Game } }
  | { type: 'JOIN_GAME'; payload: { gameId: string; player: Player } }
  | { type: 'START_GAME'; payload: { gameId: string } }
  | { type: 'FINISH_GAME'; payload: { gameId: string; loser: string } }
  | { type: 'UPDATE_GAME'; payload: { gameId: string; updates: Partial<Game> } }
  | { type: 'LOAD_GAMES'; payload: { games: Game[] } };

const initialState: GameState = {
  games: [],
  userGames: [],
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'CREATE_GAME': {
      // Use the pre-built game from the payload
      const newGame = action.payload.game;
      
      return {
        ...state,
        games: [...state.games, newGame],
      };
    }

    case 'JOIN_GAME': {
      const gameIndex = state.games.findIndex(g => g.id === action.payload.gameId);
      if (gameIndex === -1) return state;

      const game = state.games[gameIndex];
      const isAlreadyJoined = game.players.some(p => p.publicKey === action.payload.player.publicKey);
      if (isAlreadyJoined || game.gameStatus !== 'waiting') return state;

      // Calculate house fee and net amount
      const buyInAmount = action.payload.player.buyIn;
      const houseFee = buyInAmount * HOUSE_FEE_PERCENTAGE;
      const netAmount = buyInAmount - houseFee;

      const newPlayers = [...game.players, action.payload.player];
      const newTotalPot = game.totalPot + netAmount; // Only net amount goes to pot
      const newHouseFeeCollected = game.houseFeeCollected + houseFee;
      const newStatus = newPlayers.length >= game.maxPlayers ? 'full' : 'waiting';

      const updatedGame = {
        ...game,
        players: newPlayers,
        totalPot: newTotalPot,
        houseFeeCollected: newHouseFeeCollected,
        gameStatus: newStatus as Game['gameStatus'],
      };

      const newGames = [...state.games];
      newGames[gameIndex] = updatedGame;

      // Check if this is a user game
      const isUserGame = updatedGame.players.some(p => p.publicKey === action.payload.player.publicKey);
      const userGames = isUserGame 
        ? [...state.userGames.filter(g => g.id !== updatedGame.id), updatedGame]
        : state.userGames;

      // In a real implementation, you would send the house fee to HOUSE_WALLET_ADDRESS here
      console.log(`House fee collected: ${houseFee} SOL for game ${updatedGame.id}`);
      console.log(`House wallet: ${HOUSE_WALLET_ADDRESS}`);

      return {
        ...state,
        games: newGames,
        userGames,
      };
    }

    case 'START_GAME': {
      const gameIndex = state.games.findIndex(g => g.id === action.payload.gameId);
      if (gameIndex === -1) return state;

      const updatedGame = {
        ...state.games[gameIndex],
        gameStatus: 'playing' as Game['gameStatus'],
      };

      const newGames = [...state.games];
      newGames[gameIndex] = updatedGame;

      const userGameIndex = state.userGames.findIndex(g => g.id === action.payload.gameId);
      const newUserGames = userGameIndex !== -1 
        ? [...state.userGames.slice(0, userGameIndex), updatedGame, ...state.userGames.slice(userGameIndex + 1)]
        : state.userGames;

        return {
          ...state,
        games: newGames,
        userGames: newUserGames,
        };
      }

    case 'FINISH_GAME': {
      const gameIndex = state.games.findIndex(g => g.id === action.payload.gameId);
      if (gameIndex === -1) return state;

      const game = state.games[gameIndex];
      const loser = action.payload.loser;
      const winners = game.players
        .filter(p => p.publicKey !== loser)
        .map(p => p.publicKey);
      
      const updatedGame = {
        ...game,
        gameStatus: 'finished' as Game['gameStatus'],
        loser,
        winner: winners,
      };

      const newGames = [...state.games];
      newGames[gameIndex] = updatedGame;

      const userGameIndex = state.userGames.findIndex(g => g.id === action.payload.gameId);
      const newUserGames = userGameIndex !== -1 
        ? [...state.userGames.slice(0, userGameIndex), updatedGame, ...state.userGames.slice(userGameIndex + 1)]
        : state.userGames;

      // Log final house fee collection
      console.log(`Game ${updatedGame.id} finished. Total house fees collected: ${updatedGame.houseFeeCollected} SOL`);

      return {
        ...state,
        games: newGames,
        userGames: newUserGames,
      };
    }

    case 'UPDATE_GAME': {
      const gameIndex = state.games.findIndex(g => g.id === action.payload.gameId);
      if (gameIndex === -1) return state;

      const updatedGame = {
        ...state.games[gameIndex],
        ...action.payload.updates,
      };

      const newGames = [...state.games];
      newGames[gameIndex] = updatedGame;

      const userGameIndex = state.userGames.findIndex(g => g.id === action.payload.gameId);
      const newUserGames = userGameIndex !== -1 
        ? [...state.userGames.slice(0, userGameIndex), updatedGame, ...state.userGames.slice(userGameIndex + 1)]
        : state.userGames;

      return {
        ...state,
        games: newGames,
        userGames: newUserGames,
      };
    }

    case 'LOAD_GAMES': {
      // Don't completely replace local state if we have pending operations
      // This prevents race conditions between local updates and database loads
      console.log(`🔄 Loading ${action.payload.games.length} games from database`);
      
      return {
        ...state,
        games: action.payload.games,
        // Keep userGames empty - will be calculated dynamically by getUserGames()
        userGames: [], 
      };
    }

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  createGame: (name: string, buyIn: number, maxPlayers: number) => Promise<void>;
  joinGame: (gameId: string, buyIn: number) => Promise<void>;
  leaveGame: (gameId: string) => Promise<void>;
  getJoinableGames: () => Game[];
  getUserGames: () => Game[];
  refreshGames: () => Promise<void>;
  getHouseFeeInfo: () => { percentage: number; address: string };
  walletBalance: number;
  checkingBalance: boolean;
  paymentLoading: boolean;
  gamesLoading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameContextProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { publicKey, signTransaction } = useWallet();
  const [walletBalance, setWalletBalance] = useState(0);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(false);

  // Refresh games from database via API route
  const refreshGames = useCallback(async () => {
    setGamesLoading(true);
    try {
      const response = await fetch('/api/games');
      const data = await response.json();
      
      dispatch({ 
        type: 'LOAD_GAMES', 
        payload: { games: data.games || [] } 
      });
      console.log(`🔄 Refreshed ${data.games?.length || 0} games from API`);
    } catch (error) {
      console.error('❌ Failed to refresh games from API:', error);
    } finally {
      setGamesLoading(false);
    }
  }, []);

  // Initialize database tables and load games on mount
  useEffect(() => {
    const initializeDB = async () => {
      try {
        // Load existing games from API
        setGamesLoading(true);
        try {
          const response = await fetch('/api/games');
          const data = await response.json();
          
          dispatch({ 
            type: 'LOAD_GAMES', 
            payload: { games: data.games || [] } 
          });
          console.log(`🔄 Loaded ${data.games?.length || 0} games from API on initialization`);
        } catch (error) {
          console.error('❌ Failed to load games from API:', error);
        } finally {
          setGamesLoading(false);
        }
      } catch (error) {
        console.error('❌ Failed to initialize game API:', error);
      }
    };
    
    initializeDB();
  }, []);

  // Distribute winnings when game finishes
  const distributeWinnings = useCallback(async (game: Game): Promise<string> => {
    if (!game.escrowAccount || !game.winner || game.winner.length === 0) {
      throw new Error('Invalid game state for distribution');
    }

    const connection = getSolanaConnection();
    const { blockhash } = await connection.getLatestBlockhash();
    
    // Recreate escrow keypair from stored secret key
    const escrowKeypair = Keypair.fromSecretKey(new Uint8Array(game.escrowAccount.secretKey));
    
    // Calculate payouts
    const payouts = calculateGamePayouts(
      game.buyInAmount,
      game.players.length,
      HOUSE_FEE_PERCENTAGE
    );
    
    // Create winner public keys
    const winnerPubkeys = game.winner.map(winner => new PublicKey(winner));
    const housePubkey = new PublicKey(HOUSE_WALLET_ADDRESS);
    
    // Create distribution transaction
    const transaction = createWinningDistributionTransaction(
      escrowKeypair,
      winnerPubkeys,
      payouts.amountPerWinner,
      housePubkey,
      payouts.houseFeeTotal,
      blockhash
    );
    
    // Send transaction (escrow account signs automatically)
    const signature = await sendAndConfirmTransaction(connection, transaction, [escrowKeypair]);
    
    console.log(`🎉 Winnings distributed! Signature: ${signature}`);
    console.log(`💰 Each winner received: ${payouts.amountPerWinner.toFixed(4)} SOL`);
    console.log(`🏠 House fee collected: ${payouts.houseFeeTotal.toFixed(4)} SOL`);
    
    // Save distribution transactions to database via API
    try {
      // Save winning transaction
      await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_transaction',
          transactionData: {
            signature,
            transactionType: 'winning',
            amount: payouts.totalPot,
            fromAddress: escrowKeypair.publicKey.toString(),
            toAddress: game.winner.join(','), // Multiple winners
            gameId: game.id,
            status: 'confirmed',
            blockTime: Date.now(),
          }
        })
      });

      // Save house fee transaction
      if (payouts.houseFeeTotal > 0) {
        await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_transaction',
            transactionData: {
              signature: `${signature}-house`,
              transactionType: 'house_fee',
              amount: payouts.houseFeeTotal,
              fromAddress: escrowKeypair.publicKey.toString(),
              toAddress: HOUSE_WALLET_ADDRESS,
              gameId: game.id,
              status: 'confirmed',
              blockTime: Date.now(),
            }
          })
        });
      }

      // Update game in database
      await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_game',
          gameData: {
            id: game.id,
            name: game.name,
            creatorAddress: game.createdBy,
            buyInAmount: game.buyInAmount,
            maxPlayers: game.maxPlayers,
            minPlayers: game.minPlayers,
            totalPot: game.totalPot,
            houseFeeCollected: game.houseFeeCollected,
            gameStatus: 'finished',
            winnerAddresses: game.winner,
            loserAddress: game.loser,
            escrowPublicKey: game.escrowAccount.publicKey,
            escrowSecretKey: game.escrowAccount.secretKey,
            createdAt: game.createdAt,
            finishedAt: Date.now(),
            distributionSignature: signature,
          }
        })
      });
    } catch (dbError) {
      console.error('❌ Failed to save to database via API:', dbError);
      // Don't throw here - the blockchain transaction already succeeded
    }
    
    return signature;
  }, []); // Empty dependency array since the function doesn't depend on changing values

  // Auto-start games when full and simulate gameplay
  useEffect(() => {
    const fullGames = state.games.filter(game => game.gameStatus === 'full');
    
    fullGames.forEach(game => {
      const timer = setTimeout(() => {
        dispatch({ type: 'START_GAME', payload: { gameId: game.id } });
        
        // Simulate the hot potato game - randomly pick a loser after a delay
        const gameTimer = setTimeout(async () => {
          const randomLoserIndex = Math.floor(Math.random() * game.players.length);
          const loser = game.players[randomLoserIndex].publicKey;
          
          // Finish the game first
          dispatch({ type: 'FINISH_GAME', payload: { gameId: game.id, loser } });
          
          // Then distribute winnings
          try {
            const finishedGame = state.games.find(g => g.id === game.id);
            if (finishedGame) {
              const updatedGame = {
                ...finishedGame,
                gameStatus: 'finished' as Game['gameStatus'],
                loser,
                winner: finishedGame.players
                  .filter(p => p.publicKey !== loser)
                  .map(p => p.publicKey),
              };
              
              await distributeWinnings(updatedGame);
              console.log(`🎮 Game ${game.id} completed with automatic payout!`);
              
              // Show toast notifications to players
              if (publicKey) {
                const userAddress = publicKey.toString();
                if (updatedGame.winner?.includes(userAddress)) {
                  const payouts = calculateGamePayouts(
                    updatedGame.buyInAmount,
                    updatedGame.players.length,
                    HOUSE_FEE_PERCENTAGE
                  );
                  toast.success(`🎉 You won ${payouts.amountPerWinner.toFixed(4)} SOL!`, {
                    icon: '🏆',
                    duration: 6000,
                  });
                } else if (loser === userAddress) {
                  toast.error(`💀 You lost this round! Better luck next time!`, {
                    icon: '🥔',
                    duration: 5000,
                  });
                }
              }
            }
          } catch (error) {
            console.error(`Failed to distribute winnings for game ${game.id}:`, error);
            toast.error('Failed to distribute winnings. Please contact support.');
          }
        }, 5000); // 5 second game duration

        return () => clearTimeout(gameTimer);
      }, 2000); // 2 second delay before starting

      return () => clearTimeout(timer);
    });
  }, [state.games, distributeWinnings, publicKey]);

  const createGame = async (name: string, buyIn: number, maxPlayers: number) => {
    if (!publicKey || !signTransaction) return;
    
    try {
      setPaymentLoading(true);
      
      // Process payment FIRST before creating game
      const escrowAccount = generateGameEscrowAccount();
      const signature = await processPayment(publicKey, escrowAccount.publicKey, buyIn);
      
      // Calculate house fee and net amount
      const houseFee = buyIn * HOUSE_FEE_PERCENTAGE;
      const netAmount = buyIn - houseFee;
      
      // Create the creator as first player
      const creatorPlayer: Player = {
        publicKey: publicKey.toString(),
        buyIn,
        address: publicKey.toString().slice(0, 8) + '...',
        paymentConfirmed: true,
        transactionSignature: signature,
      };
      
      // Create the game object with creator already included
      const newGame: Game = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        players: [creatorPlayer], // Creator is already in the game
        gameStatus: 'waiting',
        maxPlayers,
        minPlayers: Math.max(3, Math.ceil(maxPlayers * 0.6)),
        buyInAmount: buyIn,
        totalPot: netAmount, // Creator's net contribution already included
        houseFeeCollected: houseFee, // Creator's house fee already included
        createdBy: publicKey.toString(),
        createdAt: Date.now(),
        escrowAccount: {
          publicKey: escrowAccount.publicKey.toString(),
          secretKey: Array.from(escrowAccount.secretKey),
        },
        paymentStatus: 'complete',
      };
      
      // Dispatch the game creation with creator already included
      dispatch({ 
        type: 'CREATE_GAME', 
        payload: { 
          game: newGame 
        } 
      });
      
      // Save game to database via API
      try {
        // Save game
        await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_game',
            gameData: {
              id: newGame.id,
              name,
              creatorAddress: publicKey.toString(),
              buyInAmount: buyIn,
              maxPlayers,
              minPlayers: newGame.minPlayers,
              totalPot: netAmount,
              houseFeeCollected: houseFee,
              gameStatus: 'waiting',
              escrowPublicKey: newGame.escrowAccount!.publicKey,
              escrowSecretKey: newGame.escrowAccount!.secretKey,
              createdAt: newGame.createdAt,
            }
          })
        });

        // Save creator as first player
        await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'join_game',
            playerData: {
              gameId: newGame.id,
              playerAddress: publicKey.toString(),
              buyInAmount: buyIn,
              transactionSignature: signature,
              paymentConfirmed: true,
              joinedAt: Date.now(),
            }
          })
        });

        // Save buy-in transaction
        await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_transaction',
            transactionData: {
              signature,
              transactionType: 'buy_in',
              amount: buyIn,
              fromAddress: publicKey.toString(),
              toAddress: newGame.escrowAccount!.publicKey,
              gameId: newGame.id,
              status: 'confirmed',
              blockTime: Date.now(),
            }
          })
        });

        console.log('🎮 Game saved to database via API successfully');
      } catch (dbError) {
        console.error('❌ Failed to save game to database via API:', dbError);
      }
      
      console.log('🎮 Game created with creator as first player - ONE payment only!');
      toast.success(`🎮 Game created! Paid ${buyIn} SOL (creator auto-joined)`, {
        icon: '🔥',
        duration: 5000,
      });
    } catch (error) {
      console.error('Failed to create game:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create game';
      toast.error(`Failed to create game: ${errorMessage}`, {
        icon: '❌',
        duration: 6000,
      });
      throw error;
    } finally {
      setPaymentLoading(false);
    }
  };

  const joinGame = async (gameId: string, buyIn: number) => {
    if (!publicKey || !signTransaction) return;
    
    try {
      setPaymentLoading(true);
      toast.loading('Processing payment...', { id: 'join-payment' });
      
      const game = state.games.find(g => g.id === gameId);
      if (!game?.escrowAccount) {
        throw new Error('Game escrow account not found');
      }
      
      // Process payment first
      const signature = await processPayment(publicKey, new PublicKey(game.escrowAccount.publicKey), buyIn);
      
      // Add player to game after successful payment
      const player: Player = {
        publicKey: publicKey.toString(),
        buyIn,
        address: publicKey.toString().slice(0, 8) + '...',
        paymentConfirmed: true,
        transactionSignature: signature,
      };

      dispatch({ type: 'JOIN_GAME', payload: { gameId, player } });
      
      // Save to database via API - but don't refresh immediately to avoid race condition
      try {
        // Save player
        await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'join_game',
            playerData: {
              gameId,
              playerAddress: publicKey.toString(),
              buyInAmount: buyIn,
              transactionSignature: signature,
              paymentConfirmed: true,
              joinedAt: Date.now(),
            }
          })
        });

        // Save transaction
        await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_transaction',
            transactionData: {
              signature,
              transactionType: 'buy_in',
              amount: buyIn,
              fromAddress: publicKey.toString(),
              toAddress: game.escrowAccount.publicKey,
              gameId,
              status: 'confirmed',
              blockTime: Date.now(),
            }
          })
        });

        // Update game state in database
        const updatedGame = state.games.find(g => g.id === gameId);
        if (updatedGame) {
          await fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create_game',
              gameData: {
                id: updatedGame.id,
                name: updatedGame.name,
                creatorAddress: updatedGame.createdBy,
                buyInAmount: updatedGame.buyInAmount,
                maxPlayers: updatedGame.maxPlayers,
                minPlayers: updatedGame.minPlayers,
                totalPot: updatedGame.totalPot,
                houseFeeCollected: updatedGame.houseFeeCollected,
                gameStatus: updatedGame.gameStatus,
                escrowPublicKey: updatedGame.escrowAccount!.publicKey,
                escrowSecretKey: updatedGame.escrowAccount!.secretKey,
                createdAt: updatedGame.createdAt,
              }
            })
          });
        }

        console.log('🎮 Player join saved to database via API successfully');
      } catch (dbError) {
        console.error('❌ Failed to save player to database via API:', dbError);
        // Don't fail the whole operation if database save fails
      }
      
      console.log('🎮 Player joined game and payment processed');
      
      toast.success(`🎯 Joined game! Paid ${buyIn} SOL`, {
        id: 'join-payment',
        icon: '✅',
        duration: 4000,
      });
    } catch (error) {
      console.error('Failed to join game:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join game';
      toast.error(`Failed to join game: ${errorMessage}`, {
        id: 'join-payment',
        icon: '❌',
        duration: 6000,
      });
      throw error;
    } finally {
      setPaymentLoading(false);
    }
  };

  // Process SOL payment to escrow
  const processPayment = async (playerPublicKey: PublicKey, escrowPublicKey: PublicKey, amount: number): Promise<string> => {
    if (!signTransaction) {
      throw new Error('Wallet not connected');
    }

    try {
      const connection = getSolanaConnection();
      const { blockhash } = await connection.getLatestBlockhash();
      
      // Create transaction
      const transaction = createEscrowDepositTransaction(
        playerPublicKey,
        escrowPublicKey,
        solToLamports(amount),
        blockhash
      );
      
      // Sign and send transaction
      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
      
      console.log(`💰 Payment of ${amount} SOL sent to escrow. Signature: ${signature}`);
      
      return signature;
    } catch (error) {
      console.error('Payment failed:', error);
      throw new Error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getJoinableGames = () => {
    // Use local state for immediate filtering to avoid async in the getter
    const userAddress = publicKey?.toString();
    const joinable = state.games.filter(game => {
      const isWaiting = game.gameStatus === 'waiting';
      const userNotInGame = !userAddress || !game.players.some(p => p.publicKey === userAddress);
      
      // Debug logging
      if (userAddress) {
        console.log(`🐛 Game ${game.id}: waiting=${isWaiting}, userNotInGame=${userNotInGame}, players:`, game.players.map(p => p.publicKey.slice(0, 8)));
      }
      
      return isWaiting && userNotInGame;
    });
    
    console.log(`🐛 getJoinableGames: Found ${joinable.length} joinable games for user ${userAddress?.slice(0, 8)}`);
    return joinable;
  };

  const getUserGames = () => {
    if (!publicKey) return [];
    // Use local state for immediate filtering to avoid async in the getter
    return state.games.filter(game => 
      game.players.some(p => p.publicKey === publicKey.toString()) ||
      game.createdBy === publicKey.toString()
    );
  };

  // Check wallet balance
  useEffect(() => {
    const checkBalance = async () => {
      if (!publicKey) {
        setWalletBalance(0);
        return;
      }
      
      try {
        setCheckingBalance(true);
        const balance = await getWalletBalance(publicKey);
        setWalletBalance(balance);
      } catch (error) {
        console.error('Failed to check wallet balance:', error);
        setWalletBalance(0);
      } finally {
        setCheckingBalance(false);
      }
    };

    checkBalance();
    
    // Check balance every 30 seconds
    const interval = setInterval(checkBalance, 30000);
    return () => clearInterval(interval);
  }, [publicKey]);

  const leaveGame = async (gameId: string) => {
    if (!publicKey) return;
    
    const game = state.games.find(g => g.id === gameId);
    if (!game || game.gameStatus !== 'waiting') {
      toast.error('Cannot leave this game');
      return;
    }
    
    const userPlayer = game.players.find(p => p.publicKey === publicKey.toString());
    if (!userPlayer) {
      toast.error('You are not in this game');
      return;
    }
    
    try {
      setPaymentLoading(true);
      toast.loading('Processing refund...', { id: 'leave-game' });
      
      // Process refund transaction - transfer back from escrow to user
      const connection = getSolanaConnection();
      if (game.escrowAccount && userPlayer.buyIn > 0) {
        const escrowKeypair = Keypair.fromSecretKey(new Uint8Array(game.escrowAccount.secretKey));
        const { blockhash } = await connection.getLatestBlockhash();
        
        const refundTransaction = createWinningDistributionTransaction(
          escrowKeypair,
          [publicKey], // Refund to user
          userPlayer.buyIn, // Full refund amount
          escrowKeypair.publicKey, // No house fee on refund
          0, // No house fee
          blockhash
        );
        
        const refundSignature = await sendAndConfirmTransaction(connection, refundTransaction, [escrowKeypair]);
        console.log(`💰 Refund of ${userPlayer.buyIn} SOL sent. Signature: ${refundSignature}`);
        
        // Save refund transaction to database
        try {
          await fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'save_transaction',
              transactionData: {
                signature: refundSignature,
                transactionType: 'refund',
                amount: userPlayer.buyIn,
                fromAddress: game.escrowAccount.publicKey,
                toAddress: publicKey.toString(),
                gameId: gameId,
                status: 'confirmed',
                blockTime: Date.now(),
              }
            })
          });
        } catch (dbError) {
          console.error('❌ Failed to save refund transaction:', dbError);
        }
      }
      
      const remainingPlayers = game.players.filter(p => p.publicKey !== publicKey.toString());
      
      // If this was the last player, delete the game entirely
      if (remainingPlayers.length === 0) {
        // Remove game from local state
        dispatch({ 
          type: 'LOAD_GAMES', 
          payload: { 
            games: state.games.filter(g => g.id !== gameId) 
          } 
        });
        
        console.log('🎮 Game deleted - was the last player');
        toast.success('💰 Game deleted and refunded!', { 
          id: 'leave-game',
          icon: '🗑️',
          duration: 4000,
        });
      } else {
        // Update game state - remove player and adjust pot
        const playerNetContribution = userPlayer.buyIn * (1 - HOUSE_FEE_PERCENTAGE);
        
        dispatch({ 
          type: 'UPDATE_GAME', 
          payload: { 
            gameId, 
            updates: { 
              players: remainingPlayers,
              totalPot: game.totalPot - playerNetContribution,
              houseFeeCollected: game.houseFeeCollected - (userPlayer.buyIn * HOUSE_FEE_PERCENTAGE)
            } 
          } 
        });
        
        console.log('🎮 Player left game successfully');
        toast.success('💰 Left game and refunded!', { 
          id: 'leave-game',
          icon: '👋',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Failed to leave game:', error);
      toast.error('Failed to leave game', { 
        id: 'leave-game',
        icon: '❌',
        duration: 4000,
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Periodic refresh every 30 seconds to keep games in sync with database
  // DISABLED temporarily to prevent wiping local state when database is down
  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     try {
  //       await refreshGames();
  //     } catch (error) {
  //       console.warn('⚠️ Periodic refresh failed:', error);
  //     }
  //   }, 30000); // 30 seconds

  //   return () => clearInterval(interval);
  // }, [refreshGames]);

  const getHouseFeeInfo = () => ({
    percentage: HOUSE_FEE_PERCENTAGE,
    address: HOUSE_WALLET_ADDRESS,
  });

  return (
    <GameContext.Provider value={{
      state,
      createGame,
      joinGame,
      leaveGame,
      getJoinableGames,
      getUserGames,
      refreshGames,
      getHouseFeeInfo,
      walletBalance,
      checkingBalance,
      paymentLoading,
      gamesLoading,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameContextProvider');
  }
  return context;
} 