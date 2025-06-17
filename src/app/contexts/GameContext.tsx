'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

// House configuration
const HOUSE_FEE_PERCENTAGE = parseFloat(process.env.NEXT_PUBLIC_HOUSE_FEE_PERCENTAGE || '0.03');
const HOUSE_WALLET_ADDRESS = process.env.NEXT_PUBLIC_HOUSE_WALLET_ADDRESS || "CHyQpdkGgoQbQDdm9vgjc3NpiBQ9wQ8Fu8LHQaPwoNdN";

export interface Player {
  publicKey: string;
  buyIn: number;
  address: string;
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
  houseFeeCollected: number; // Track house fees
  createdBy: string;
  createdAt: number;
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
      const newGame: Game = {
        id: Math.random().toString(36).substr(2, 9),
        players: [],
        gameStatus: 'waiting',
        maxPlayers: action.payload.maxPlayers,
        minPlayers: Math.max(3, Math.ceil(action.payload.maxPlayers * 0.6)), // 60% of max for min
        buyInAmount: action.payload.buyIn,
        totalPot: 0,
        houseFeeCollected: 0,
        createdBy: action.payload.createdBy,
        createdAt: Date.now(),
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
  createGame: (buyIn: number, maxPlayers: number) => void;
  joinGame: (gameId: string, buyIn: number) => void;
  getJoinableGames: () => Game[];
  getUserGames: () => Game[];
  getHouseFeeInfo: () => { percentage: number; address: string };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameContextProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { publicKey } = useWallet();

  // Auto-start games when full and simulate gameplay
  useEffect(() => {
    const fullGames = state.games.filter(game => game.gameStatus === 'full');
    
    fullGames.forEach(game => {
      const timer = setTimeout(() => {
        dispatch({ type: 'START_GAME', payload: { gameId: game.id } });
        
        // Simulate the hot potato game - randomly pick a loser after a delay
        const gameTimer = setTimeout(() => {
          const randomLoserIndex = Math.floor(Math.random() * game.players.length);
          const loser = game.players[randomLoserIndex].publicKey;
          dispatch({ type: 'FINISH_GAME', payload: { gameId: game.id, loser } });
        }, 5000); // 5 second game duration

        return () => clearTimeout(gameTimer);
      }, 2000); // 2 second delay before starting

      return () => clearTimeout(timer);
    });
  }, [state.games]);

  const createGame = (buyIn: number, maxPlayers: number) => {
    if (!publicKey) return;
    
    dispatch({ 
      type: 'CREATE_GAME', 
      payload: { 
        buyIn, 
        maxPlayers, 
        createdBy: publicKey.toString() 
      } 
    });
  };

  const joinGame = (gameId: string, buyIn: number) => {
    if (!publicKey) return;
    
    const player: Player = {
      publicKey: publicKey.toString(),
      buyIn,
      address: publicKey.toString().slice(0, 8) + '...',
    };

    dispatch({ type: 'JOIN_GAME', payload: { gameId, player } });
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