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
import { 
  saveGame, 
  saveGamePlayer, 
  saveTransaction,
  initializeGameTables 
} from '@/lib/db';

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
  | { type: 'CREATE_GAME'; payload: { buyIn: number; maxPlayers: number; createdBy: string } }
  | { type: 'JOIN_GAME'; payload: { gameId: string; player: Player } }
  | { type: 'START_GAME'; payload: { gameId: string } }
  | { type: 'FINISH_GAME'; payload: { gameId: string; loser: string } }
  | { type: 'UPDATE_GAME'; payload: { gameId: string; updates: Partial<Game> } };

const initialState: GameState = {
  games: [],
  userGames: [],
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'CREATE_GAME': {
      const escrowAccount = generateGameEscrowAccount();
      const newGame: Game = {
        id: Math.random().toString(36).substr(2, 9),
        players: [],
        gameStatus: 'waiting',
        maxPlayers: action.payload.maxPlayers,
        minPlayers: Math.max(3, Math.ceil(action.payload.maxPlayers * 0.6)),
        buyInAmount: action.payload.buyIn,
        totalPot: 0,
        houseFeeCollected: 0,
        createdBy: action.payload.createdBy,
        createdAt: Date.now(),
        escrowAccount: {
          publicKey: escrowAccount.publicKey.toString(),
          secretKey: Array.from(escrowAccount.secretKey),
        },
        paymentStatus: 'pending',
      };

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

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  createGame: (buyIn: number, maxPlayers: number) => Promise<void>;
  joinGame: (gameId: string, buyIn: number) => Promise<void>;
  getJoinableGames: () => Game[];
  getUserGames: () => Game[];
  getHouseFeeInfo: () => { percentage: number; address: string };
  walletBalance: number;
  checkingBalance: boolean;
  paymentLoading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameContextProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { publicKey, signTransaction } = useWallet();
  const [walletBalance, setWalletBalance] = useState(0);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Initialize database tables on mount
  useEffect(() => {
    const initializeDB = async () => {
      try {
        await initializeGameTables();
        console.log('✅ Game database tables initialized');
      } catch (error) {
        console.error('❌ Failed to initialize game database:', error);
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
    
    // Save distribution transaction to database
    try {
      await saveTransaction({
        signature,
        transactionType: 'winning',
        amount: payouts.totalPot,
        fromAddress: escrowKeypair.publicKey.toString(),
        toAddress: game.winner.join(','), // Multiple winners
        gameId: game.id,
        status: 'confirmed',
        blockTime: Date.now(),
      });

      // Save house fee transaction
      if (payouts.houseFeeTotal > 0) {
        await saveTransaction({
          signature: `${signature}-house`,
          transactionType: 'house_fee',
          amount: payouts.houseFeeTotal,
          fromAddress: escrowKeypair.publicKey.toString(),
          toAddress: HOUSE_WALLET_ADDRESS,
          gameId: game.id,
          status: 'confirmed',
          blockTime: Date.now(),
        });
      }

      // Update game in database
      await saveGame({
        id: game.id,
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
      });
    } catch (dbError) {
      console.error('❌ Failed to save to database:', dbError);
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

  const createGame = async (buyIn: number, maxPlayers: number) => {
    if (!publicKey || !signTransaction) return;
    
    try {
      setPaymentLoading(true);
      
      // Create the game first (creates escrow account)
      dispatch({ 
        type: 'CREATE_GAME', 
        payload: { 
          buyIn, 
          maxPlayers, 
          createdBy: publicKey.toString() 
        } 
      });
      
      // Get the newly created game
      const newGame = state.games[state.games.length - 1];
      
      // Creator must also deposit their buy-in
      if (newGame?.escrowAccount) {
        const signature = await processPayment(publicKey, new PublicKey(newGame.escrowAccount.publicKey), buyIn);
        
        // Save game to database
        try {
          await saveGame({
            id: newGame.id,
            creatorAddress: publicKey.toString(),
            buyInAmount: buyIn,
            maxPlayers,
            minPlayers: newGame.minPlayers,
            totalPot: 0,
            houseFeeCollected: 0,
            gameStatus: 'waiting',
            escrowPublicKey: newGame.escrowAccount.publicKey,
            escrowSecretKey: newGame.escrowAccount.secretKey,
            createdAt: newGame.createdAt,
          });

          // Save creator as first player
          await saveGamePlayer({
            gameId: newGame.id,
            playerAddress: publicKey.toString(),
            buyInAmount: buyIn,
            transactionSignature: signature,
            paymentConfirmed: true,
            joinedAt: Date.now(),
          });

          // Save buy-in transaction
          await saveTransaction({
            signature,
            transactionType: 'buy_in',
            amount: buyIn,
            fromAddress: publicKey.toString(),
            toAddress: newGame.escrowAccount.publicKey,
            gameId: newGame.id,
            status: 'confirmed',
            blockTime: Date.now(),
          });
        } catch (dbError) {
          console.error('❌ Failed to save game to database:', dbError);
        }
      }
      
      console.log('🎮 Game created and creator payment processed');
      toast.success(`🎮 Game created! Buy-in: ${buyIn} SOL`, {
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
      
      // Save to database
      try {
        await saveGamePlayer({
          gameId,
          playerAddress: publicKey.toString(),
          buyInAmount: buyIn,
          transactionSignature: signature,
          paymentConfirmed: true,
          joinedAt: Date.now(),
        });

        await saveTransaction({
          signature,
          transactionType: 'buy_in',
          amount: buyIn,
          fromAddress: publicKey.toString(),
          toAddress: game.escrowAccount.publicKey,
          gameId,
          status: 'confirmed',
          blockTime: Date.now(),
        });

        // Update game state in database
        const updatedGame = state.games.find(g => g.id === gameId);
        if (updatedGame) {
          await saveGame({
            id: updatedGame.id,
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
          });
        }
      } catch (dbError) {
        console.error('❌ Failed to save player to database:', dbError);
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
    return state.games.filter(game => 
      game.gameStatus === 'waiting' && 
      (!publicKey || !game.players.some(p => p.publicKey === publicKey.toString()))
    );
  };

  const getUserGames = () => {
    if (!publicKey) return [];
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

  const getHouseFeeInfo = () => ({
    percentage: HOUSE_FEE_PERCENTAGE,
    address: HOUSE_WALLET_ADDRESS,
  });

  return (
    <GameContext.Provider value={{
      state,
      createGame,
      joinGame,
      getJoinableGames,
      getUserGames,
      getHouseFeeInfo,
      walletBalance,
      checkingBalance,
      paymentLoading,
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