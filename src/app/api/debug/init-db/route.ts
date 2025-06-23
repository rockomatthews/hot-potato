import { NextResponse } from 'next/server';
import { initializeGameTables, initializeDatabase } from '@/lib/db';
import { Pool } from '@neondatabase/serverless';

export async function POST() {
  try {
    console.log('🔄 Initializing database tables...');
    
    // Initialize user profiles table
    await initializeDatabase();
    
    // Initialize game tables
    await initializeGameTables();
    
    console.log('✅ All database tables initialized successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database tables initialized successfully',
      tables: ['user_profiles', 'games', 'game_players', 'transactions']
    });
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  console.log('🔍 Testing actual database connection in API route...');
  
  // Get database URL exactly like the main db.ts file
  function getDatabaseUrl() {
    console.log('🔍 Runtime environment variables check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('VERCEL:', process.env.VERCEL);
    console.log('Available env keys:', Object.keys(process.env).filter(k => 
      k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('PG')
    ));
    
    // First try the direct URL variables
    const directUrl = process.env.DATABASE_URL || 
                     process.env.POSTGRES_URL || 
                     process.env.POSTGRES_URL_NON_POOLING ||
                     process.env.POSTGRES_PRISMA_URL ||
                     process.env.NEON_DATABASE_URL;
                     
    if (directUrl) {
      console.log('✅ Found direct database URL');
      console.log('🔍 URL length:', directUrl.length);
      console.log('🔍 URL starts with:', directUrl.substring(0, 20));
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
  
  if (!databaseUrl) {
    return NextResponse.json({
      status: 'error',
      message: 'No database URL found',
      envVars: {
        DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Missing',
        POSTGRES_URL: process.env.POSTGRES_URL ? 'Set' : 'Missing',
        POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? 'Set' : 'Missing',
        POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? 'Set' : 'Missing'
      }
    });
  }
  
  try {
    console.log('🔄 Testing pool connection...');
    const pool = new Pool({ connectionString: databaseUrl });
    
    // Test basic query
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Pool connection successful:', result.rows[0]);
    
    // Test table creation (games table)
    console.log('🔄 Testing games table creation...');
    await pool.query(`
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
    `);
    console.log('✅ Games table created successfully');
    
    // Test game_players table
    console.log('🔄 Testing game_players table creation...');
    await pool.query(`
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
    `);
    console.log('✅ Game players table created successfully');
    
    // Check existing games
    const existingGames = await pool.query('SELECT COUNT(*) as game_count FROM games');
    console.log('📊 Existing games count:', existingGames.rows[0]);
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection and table creation successful!',
      connectionTest: result.rows[0],
      existingGames: existingGames.rows[0],
      databaseUrl: databaseUrl.substring(0, 30) + '...' // Show partial URL for security
    });
    
  } catch (error) {
    console.error('❌ Database operation failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database operation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 