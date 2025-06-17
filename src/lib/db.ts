import { neon } from '@neondatabase/serverless';

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

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
    throw new Error('Database connection not available. Please check DATABASE_URL environment variable.');
  }
  return sql;
}

// Initialize the users table
export async function initializeDatabase() {
  const db = ensureDatabaseConnection();
  
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
  
  try {
    const result = await db`
      SELECT * FROM user_profiles 
      WHERE wallet_address = ${walletAddress}
      LIMIT 1
    `;
    return result[0] as UserProfile || null;
  } catch (error) {
    console.error('Error fetching user by wallet:', error);
    throw error;
  }
}

// Get user profile by username
export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  const db = ensureDatabaseConnection();
  
  try {
    const result = await db`
      SELECT * FROM user_profiles 
      WHERE username = ${username}
      LIMIT 1
    `;
    return result[0] as UserProfile || null;
  } catch (error) {
    console.error('Error fetching user by username:', error);
    throw error;
  }
}

// Create new user profile
export async function createUser(userData: CreateUserProfile): Promise<UserProfile> {
  const db = ensureDatabaseConnection();
  
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
    throw error;
  }
}

export { sql }; 