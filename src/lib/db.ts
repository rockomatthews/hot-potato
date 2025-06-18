import { neon } from '@neondatabase/serverless';

// Try multiple possible database URL environment variables
function getDatabaseUrl() {
  // Debug: Log all possible environment variables at runtime
  if (typeof window === 'undefined') { // Server-side only
    console.log('🔍 Runtime environment variables check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('VERCEL:', process.env.VERCEL);
    console.log('Available env keys:', Object.keys(process.env).filter(k => 
      k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('PG')
    ));
  }
  
  // First try the direct URL variables
  const directUrl = process.env.DATABASE_URL || 
                   process.env.POSTGRES_URL || 
                   process.env.POSTGRES_URL_NON_POOLING ||
                   process.env.POSTGRES_PRISMA_URL ||
                   process.env.NEON_DATABASE_URL;
                   
  if (directUrl) {
    console.log('✅ Found direct database URL');
    return directUrl;
  }
  
  // If no direct URL, try to build one from components
  const host = process.env.PGHOST || process.env.POSTGRES_HOST;
  const user = process.env.PGUSER || process.env.POSTGRES_USER;
  const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const database = process.env.PGDATABASE || process.env.POSTGRES_DATABASE;
  
  if (host && user && password && database) {
    const connectionString = `postgresql://${user}:${password}@${host}/${database}?sslmode=require`;
    console.log('🔧 Built connection string from components');
    return connectionString;
  }
  
  console.log('❌ No database connection string found');
  return null;
}

const databaseUrl = getDatabaseUrl();

console.log('🔍 Database configuration:', {
  // Direct URL variables
  DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
  POSTGRES_URL: process.env.POSTGRES_URL ? '✅ Set' : '❌ Missing', 
  POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '✅ Set' : '❌ Missing',
  POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '✅ Set' : '❌ Missing',
  // Component variables
  PGHOST: process.env.PGHOST ? '✅ Set' : '❌ Missing',
  POSTGRES_HOST: process.env.POSTGRES_HOST ? '✅ Set' : '❌ Missing',
  PGUSER: process.env.PGUSER ? '✅ Set' : '❌ Missing',
  POSTGRES_USER: process.env.POSTGRES_USER ? '✅ Set' : '❌ Missing',
  PGPASSWORD: process.env.PGPASSWORD ? '✅ Set' : '❌ Missing',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ? '✅ Set' : '❌ Missing',
  PGDATABASE: process.env.PGDATABASE ? '✅ Set' : '❌ Missing',
  POSTGRES_DATABASE: process.env.POSTGRES_DATABASE ? '✅ Set' : '❌ Missing',
  selectedUrl: databaseUrl ? '✅ Found connection string' : '❌ No connection string found'
});

const sql = databaseUrl ? neon(databaseUrl) : null;

export interface UserProfile {
  id: number;
  wallet_address: string;
  username: string;
  profile_picture_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserProfile {
  wallet_address: string;
  username: string;
  profile_picture_url?: string;
}

export interface UpdateUserProfile {
  username?: string;
  profile_picture_url?: string;
}

function ensureDatabaseConnection() {
  if (!sql) {
    console.warn('⚠️ Database not available - Hot Potato game will run without user profiles');
    // Return null to indicate no database available
    return null;
  }
  return sql;
}

// Initialize the users table
export async function initializeDatabase() {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    console.log('⚠️ Skipping database initialization - no connection available');
    return;
  }
  
  try {
    await db`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        wallet_address TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        profile_picture_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Create index for faster lookups
    await db`
      CREATE INDEX IF NOT EXISTS idx_wallet_address ON user_profiles(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_username ON user_profiles(username);
    `;
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Get user profile by wallet address
export async function getUserByWallet(walletAddress: string): Promise<UserProfile | null> {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    console.log('⚠️ Database not available - returning null for user profile');
    return null;
  }
  
  try {
    const result = await db`
      SELECT * FROM user_profiles 
      WHERE wallet_address = ${walletAddress}
      LIMIT 1
    `;
    return result[0] as UserProfile || null;
  } catch (error) {
    console.error('Error fetching user by wallet:', error);
    return null;
  }
}

// Get user profile by username
export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    return null;
  }
  
  try {
    const result = await db`
      SELECT * FROM user_profiles 
      WHERE username = ${username}
      LIMIT 1
    `;
    return result[0] as UserProfile || null;
  } catch (error) {
    console.error('Error fetching user by username:', error);
    return null;
  }
}

// Create new user profile
export async function createUser(userData: CreateUserProfile): Promise<UserProfile> {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    throw new Error('Database not available');
  }
  
  try {
    const result = await db`
      INSERT INTO user_profiles (wallet_address, username, profile_picture_url)
      VALUES (${userData.wallet_address}, ${userData.username}, ${userData.profile_picture_url || null})
      RETURNING *
    `;
    return result[0] as UserProfile;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Update user profile
export async function updateUser(walletAddress: string, updates: UpdateUserProfile): Promise<UserProfile> {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    throw new Error('Database not available');
  }
  
  try {
    const result = await db`
      UPDATE user_profiles 
      SET 
        username = COALESCE(${updates.username}, username),
        profile_picture_url = COALESCE(${updates.profile_picture_url}, profile_picture_url),
        updated_at = NOW()
      WHERE wallet_address = ${walletAddress}
      RETURNING *
    `;
    
    if (result.length === 0) {
      throw new Error('User not found');
    }
    
    return result[0] as UserProfile;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Check if username is available
export async function isUsernameAvailable(username: string, excludeWallet?: string): Promise<boolean> {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    return true; // If no database, assume username is available
  }
  
  try {
    let result;
    
    if (excludeWallet) {
      result = await db`
        SELECT 1 FROM user_profiles 
        WHERE username = ${username} AND wallet_address != ${excludeWallet}
        LIMIT 1
      `;
    } else {
      result = await db`
        SELECT 1 FROM user_profiles 
        WHERE username = ${username}
        LIMIT 1
      `;
    }
    
    return result.length === 0;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return true;
  }
}

// Create games table
export async function createGamesTable() {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    console.log('⚠️ Skipping games table creation - no database connection');
    return;
  }
  
  try {
    await db`
      CREATE TABLE IF NOT EXISTS games (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) DEFAULT '',
        creator_address VARCHAR(255) NOT NULL,
        buy_in_amount DECIMAL(10, 8) NOT NULL,
        max_players INTEGER NOT NULL,
        min_players INTEGER NOT NULL,
        total_pot DECIMAL(10, 8) DEFAULT 0,
        house_fee_collected DECIMAL(10, 8) DEFAULT 0,
        game_status VARCHAR(20) DEFAULT 'waiting',
        winner_addresses TEXT,
        loser_address VARCHAR(255),
        escrow_public_key VARCHAR(255),
        escrow_secret_key TEXT,
        created_at BIGINT NOT NULL,
        finished_at BIGINT,
        distribution_signature VARCHAR(255)
      );
    `;
    
    // Add name column if it doesn't exist (for existing databases)
    await db`
      ALTER TABLE games ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT '';
    `;
    
    console.log('✅ Games table created/verified');
  } catch (error) {
    console.error('❌ Error creating games table:', error);
    throw error;
  }
}

// Create game_players table
export async function createGamePlayersTable() {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    console.log('⚠️ Skipping game players table creation - no database connection');
    return;
  }
  
  try {
    await db`
      CREATE TABLE IF NOT EXISTS game_players (
        id SERIAL PRIMARY KEY,
        game_id VARCHAR(50) NOT NULL,
        player_address VARCHAR(255) NOT NULL,
        buy_in_amount DECIMAL(10, 8) NOT NULL,
        transaction_signature VARCHAR(255),
        payment_confirmed BOOLEAN DEFAULT false,
        joined_at BIGINT NOT NULL,
        UNIQUE(game_id, player_address)
      );
    `;
    
    console.log('✅ Game players table created/verified');
  } catch (error) {
    console.error('❌ Error creating game players table:', error);
    throw error;
  }
}

// Create transactions table
export async function createTransactionsTable() {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    console.log('⚠️ Skipping transactions table creation - no database connection');
    return;
  }
  
  try {
    await db`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        signature VARCHAR(255) UNIQUE NOT NULL,
        transaction_type VARCHAR(20) NOT NULL,
        amount DECIMAL(10, 8) NOT NULL,
        from_address VARCHAR(255),
        to_address VARCHAR(255),
        game_id VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending',
        block_time BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('✅ Transactions table created/verified');
  } catch (error) {
    console.error('❌ Error creating transactions table:', error);
    throw error;
  }
}

// Initialize all gaming tables
export async function initializeGameTables() {
  await createGamesTable();
  await createGamePlayersTable();
  await createTransactionsTable();
}

// Save game to database
export async function saveGame(game: {
  id: string;
  name?: string;
  creatorAddress: string;
  buyInAmount: number;
  maxPlayers: number;
  minPlayers: number;
  totalPot: number;
  houseFeeCollected: number;
  gameStatus: string;
  winnerAddresses?: string[];
  loserAddress?: string;
  escrowPublicKey: string;
  escrowSecretKey: number[];
  createdAt: number;
  finishedAt?: number;
  distributionSignature?: string;
}) {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    console.log('⚠️ Game data not saved - no database connection');
    return;
  }
  
  try {
    await db`
      INSERT INTO games (
        id, name, creator_address, buy_in_amount, max_players, min_players,
        total_pot, house_fee_collected, game_status, winner_addresses,
        loser_address, escrow_public_key, escrow_secret_key, created_at,
        finished_at, distribution_signature
      )
      VALUES (
        ${game.id}, ${game.name || ''}, ${game.creatorAddress}, ${game.buyInAmount}, 
        ${game.maxPlayers}, ${game.minPlayers}, ${game.totalPot}, 
        ${game.houseFeeCollected}, ${game.gameStatus}, 
        ${game.winnerAddresses ? JSON.stringify(game.winnerAddresses) : null},
        ${game.loserAddress || null}, ${game.escrowPublicKey}, 
        ${JSON.stringify(game.escrowSecretKey)}, ${game.createdAt},
        ${game.finishedAt || null}, ${game.distributionSignature || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        total_pot = EXCLUDED.total_pot,
        house_fee_collected = EXCLUDED.house_fee_collected,
        game_status = EXCLUDED.game_status,
        winner_addresses = EXCLUDED.winner_addresses,
        loser_address = EXCLUDED.loser_address,
        finished_at = EXCLUDED.finished_at,
        distribution_signature = EXCLUDED.distribution_signature;
    `;
    
    console.log(`✅ Game ${game.id} saved to database`);
  } catch (error) {
    console.error('❌ Error saving game:', error);
    throw error;
  }
}

// Save player to game
export async function saveGamePlayer(player: {
  gameId: string;
  playerAddress: string;
  buyInAmount: number;
  transactionSignature?: string;
  paymentConfirmed: boolean;
  joinedAt: number;
}) {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    console.log('⚠️ Player data not saved - no database connection');
    return;
  }
  
  try {
    await db`
      INSERT INTO game_players (
        game_id, player_address, buy_in_amount, transaction_signature,
        payment_confirmed, joined_at
      )
      VALUES (
        ${player.gameId}, ${player.playerAddress}, ${player.buyInAmount},
        ${player.transactionSignature || null}, ${player.paymentConfirmed}, 
        ${player.joinedAt}
      )
      ON CONFLICT (game_id, player_address) DO UPDATE SET
        transaction_signature = EXCLUDED.transaction_signature,
        payment_confirmed = EXCLUDED.payment_confirmed;
    `;
    
    console.log(`✅ Player ${player.playerAddress} saved to game ${player.gameId}`);
  } catch (error) {
    console.error('❌ Error saving game player:', error);
    throw error;
  }
}

// Save transaction
export async function saveTransaction(transaction: {
  signature: string;
  transactionType: string;
  amount: number;
  fromAddress?: string;
  toAddress?: string;
  gameId?: string;
  status: string;
  blockTime?: number;
}) {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    console.log('⚠️ Transaction not saved - no database connection');
    return;
  }
  
  try {
    await db`
      INSERT INTO transactions (
        signature, transaction_type, amount, from_address, to_address,
        game_id, status, block_time
      )
      VALUES (
        ${transaction.signature}, ${transaction.transactionType}, ${transaction.amount},
        ${transaction.fromAddress || null}, ${transaction.toAddress || null},
        ${transaction.gameId || null}, ${transaction.status}, 
        ${transaction.blockTime || null}
      )
      ON CONFLICT (signature) DO UPDATE SET
        status = EXCLUDED.status,
        block_time = EXCLUDED.block_time;
    `;
    
    console.log(`✅ Transaction ${transaction.signature} saved`);
  } catch (error) {
    console.error('❌ Error saving transaction:', error);
    throw error;
  }
}

// Get user's transaction history
export async function getUserTransactions(userAddress: string) {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    return [];
  }
  
  try {
    const result = await db`
      SELECT t.*, g.id as game_id
      FROM transactions t
      LEFT JOIN games g ON t.game_id = g.id
      WHERE t.from_address = ${userAddress} OR t.to_address = ${userAddress}
      ORDER BY t.created_at DESC
      LIMIT 100;
    `;
    
    return result;
  } catch (error) {
    console.error('❌ Error getting user transactions:', error);
    throw error;
  }
}

// Get user's game history
export async function getUserGameHistory(userAddress: string) {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    return [];
  }
  
  try {
    const result = await db`
      SELECT DISTINCT g.*
      FROM games g
      JOIN game_players gp ON g.id = gp.game_id
      WHERE gp.player_address = ${userAddress} OR g.creator_address = ${userAddress}
      ORDER BY g.created_at DESC;
    `;
    
    return result;
  } catch (error) {
    console.error('❌ Error getting user game history:', error);
    throw error;
  }
}

// Load all active games from database
export async function loadAllGames() {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    console.log('⚠️ Cannot load games - no database connection');
    return [];
  }
  
  try {
    // Get all games that are not finished
    const games = await db`
      SELECT * FROM games 
      WHERE game_status IN ('waiting', 'full', 'playing')
      ORDER BY created_at DESC;
    `;
    
    // For each game, load its players and convert to Game interface format
    const gamesWithPlayers = await Promise.all(
      games.map(async (game) => {
        const players = await db`
          SELECT * FROM game_players 
          WHERE game_id = ${game.id} AND payment_confirmed = true
          ORDER BY joined_at ASC;
        `;
        
        return {
          id: game.id,
          name: game.name || `Game #${game.id}`,
          players: players.map(p => ({
            publicKey: p.player_address,
            buyIn: parseFloat(p.buy_in_amount),
            address: p.player_address.slice(0, 8) + '...',
            transactionSignature: p.transaction_signature,
            paymentConfirmed: p.payment_confirmed,
          })),
          gameStatus: game.game_status as 'waiting' | 'full' | 'playing' | 'finished',
          maxPlayers: game.max_players,
          minPlayers: game.min_players,
          buyInAmount: parseFloat(game.buy_in_amount),
          totalPot: parseFloat(game.total_pot || '0'),
          houseFeeCollected: parseFloat(game.house_fee_collected || '0'),
          createdBy: game.creator_address,
          createdAt: game.created_at,
          winner: game.winner_addresses ? JSON.parse(game.winner_addresses) : undefined,
          loser: game.loser_address,
          escrowAccount: game.escrow_public_key ? {
            publicKey: game.escrow_public_key,
            secretKey: JSON.parse(game.escrow_secret_key || '[]'),
          } : undefined,
          paymentStatus: 'complete' as const, // Assume complete if loaded from DB
        };
      })
    );
    
    console.log(`✅ Loaded ${gamesWithPlayers.length} active games from database`);
    return gamesWithPlayers;
  } catch (error) {
    console.error('❌ Error loading games from database:', error);
    return [];
  }
}

// Load games for a specific user (games they created or joined)
export async function loadUserGames(userAddress: string) {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    return [];
  }
  
  try {
    // Get games where user is creator or player
    const games = await db`
      SELECT DISTINCT g.* FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      WHERE g.creator_address = ${userAddress} 
         OR (gp.player_address = ${userAddress} AND gp.payment_confirmed = true)
      ORDER BY g.created_at DESC;
    `;
    
    // For each game, load its players and convert to Game interface format
    const gamesWithPlayers = await Promise.all(
      games.map(async (game) => {
        const players = await db`
          SELECT * FROM game_players 
          WHERE game_id = ${game.id} AND payment_confirmed = true
          ORDER BY joined_at ASC;
        `;
        
        return {
          id: game.id,
          name: game.name || `Game #${game.id}`,
          players: players.map(p => ({
            publicKey: p.player_address,
            buyIn: parseFloat(p.buy_in_amount),
            address: p.player_address.slice(0, 8) + '...',
            transactionSignature: p.transaction_signature,
            paymentConfirmed: p.payment_confirmed,
          })),
          gameStatus: game.game_status as 'waiting' | 'full' | 'playing' | 'finished',
          maxPlayers: game.max_players,
          minPlayers: game.min_players,
          buyInAmount: parseFloat(game.buy_in_amount),
          totalPot: parseFloat(game.total_pot || '0'),
          houseFeeCollected: parseFloat(game.house_fee_collected || '0'),
          createdBy: game.creator_address,
          createdAt: game.created_at,
          winner: game.winner_addresses ? JSON.parse(game.winner_addresses) : undefined,
          loser: game.loser_address,
          escrowAccount: game.escrow_public_key ? {
            publicKey: game.escrow_public_key,
            secretKey: JSON.parse(game.escrow_secret_key || '[]'),
          } : undefined,
          paymentStatus: 'complete' as const, // Assume complete if loaded from DB
        };
      })
    );
    
    return gamesWithPlayers;
  } catch (error) {
    console.error('❌ Error loading user games:', error);
    return [];
  }
}

// Load joinable games (games user hasn't joined yet)
export async function loadJoinableGames(userAddress?: string) {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    return [];
  }
  
  try {
    let games;
    
    if (userAddress) {
      // Get waiting games where user is not already a player
      games = await db`
        SELECT g.* FROM games g
        WHERE g.game_status = 'waiting' 
          AND g.id NOT IN (
            SELECT gp.game_id FROM game_players gp 
            WHERE gp.player_address = ${userAddress} AND gp.payment_confirmed = true
          )
        ORDER BY g.created_at DESC;
      `;
    } else {
      // Get all waiting games
      games = await db`
        SELECT * FROM games 
        WHERE game_status = 'waiting'
        ORDER BY created_at DESC;
      `;
    }
    
    // For each game, load its players and convert to Game interface format
    const gamesWithPlayers = await Promise.all(
      games.map(async (game) => {
        const players = await db`
          SELECT * FROM game_players 
          WHERE game_id = ${game.id} AND payment_confirmed = true
          ORDER BY joined_at ASC;
        `;
        
        return {
          id: game.id,
          name: game.name || `Game #${game.id}`,
          players: players.map(p => ({
            publicKey: p.player_address,
            buyIn: parseFloat(p.buy_in_amount),
            address: p.player_address.slice(0, 8) + '...',
            transactionSignature: p.transaction_signature,
            paymentConfirmed: p.payment_confirmed,
          })),
          gameStatus: game.game_status as 'waiting' | 'full' | 'playing' | 'finished',
          maxPlayers: game.max_players,
          minPlayers: game.min_players,
          buyInAmount: parseFloat(game.buy_in_amount),
          totalPot: parseFloat(game.total_pot || '0'),
          houseFeeCollected: parseFloat(game.house_fee_collected || '0'),
          createdBy: game.creator_address,
          createdAt: game.created_at,
          winner: game.winner_addresses ? JSON.parse(game.winner_addresses) : undefined,
          loser: game.loser_address,
          escrowAccount: game.escrow_public_key ? {
            publicKey: game.escrow_public_key,
            secretKey: JSON.parse(game.escrow_secret_key || '[]'),
          } : undefined,
          paymentStatus: 'complete' as const, // Assume complete if loaded from DB
        };
      })
    );
    
    return gamesWithPlayers;
  } catch (error) {
    console.error('❌ Error loading joinable games:', error);
    return [];
  }
}

// Remove player from game (for leave functionality)
export async function removePlayerFromGame(gameId: string, playerAddress: string) {
  const db = ensureDatabaseConnection();
  
  if (!db) {
    console.log('⚠️ Cannot remove player - no database connection');
    return;
  }
  
  try {
    await db`
      DELETE FROM game_players 
      WHERE game_id = ${gameId} AND player_address = ${playerAddress};
    `;
    
    console.log(`✅ Player ${playerAddress} removed from game ${gameId}`);
  } catch (error) {
    console.error('❌ Error removing player from game:', error);
    throw error;
  }
}

export { sql }; 