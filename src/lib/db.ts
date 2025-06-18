import { neon } from '@neondatabase/serverless';

// Try multiple possible database URL environment variables
function getDatabaseUrl() {
  // First try the direct URL variables
  const directUrl = process.env.DATABASE_URL || 
                   process.env.POSTGRES_URL || 
                   process.env.POSTGRES_URL_NON_POOLING ||
                   process.env.POSTGRES_PRISMA_URL ||
                   process.env.NEON_DATABASE_URL;
                   
  if (directUrl) {
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
        id, creator_address, buy_in_amount, max_players, min_players,
        total_pot, house_fee_collected, game_status, winner_addresses,
        loser_address, escrow_public_key, escrow_secret_key, created_at,
        finished_at, distribution_signature
      )
      VALUES (
        ${game.id}, ${game.creatorAddress}, ${game.buyInAmount}, 
        ${game.maxPlayers}, ${game.minPlayers}, ${game.totalPot}, 
        ${game.houseFeeCollected}, ${game.gameStatus}, 
        ${game.winnerAddresses ? JSON.stringify(game.winnerAddresses) : null},
        ${game.loserAddress || null}, ${game.escrowPublicKey}, 
        ${JSON.stringify(game.escrowSecretKey)}, ${game.createdAt},
        ${game.finishedAt || null}, ${game.distributionSignature || null}
      )
      ON CONFLICT (id) DO UPDATE SET
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

export { sql }; 