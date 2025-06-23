import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { Pool } from '@neondatabase/serverless';

export async function GET() {
  console.log('🔍 Testing database connection...');
  
  // Debug: Log environment variables
  const envDebug = {
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Missing',
    POSTGRES_URL: process.env.POSTGRES_URL ? 'Set' : 'Missing',
    DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
    POSTGRES_URL_length: process.env.POSTGRES_URL?.length || 0,
  };
  
  console.log('Environment check:', envDebug);
  
  // Get database URL exactly like the main db.ts file
  function getDatabaseUrl() {
    const directUrl = process.env.DATABASE_URL || 
                     process.env.POSTGRES_URL || 
                     process.env.POSTGRES_URL_NON_POOLING ||
                     process.env.POSTGRES_PRISMA_URL;
                     
    if (directUrl) {
      console.log('✅ Found direct database URL');
      return directUrl;
    }
    
    console.log('❌ No database connection string found');
    return null;
  }
  
  const databaseUrl = getDatabaseUrl();
  
  if (!databaseUrl) {
    return NextResponse.json({
      status: 'error',
      message: 'No database URL found',
      envDebug
    });
  }
  
  try {
    // Test 1: Basic connection
    console.log('Testing basic neon connection...');
    const sql = neon(databaseUrl);
    const testQuery = await sql`SELECT NOW() as current_time, version() as postgres_version`;
    
    console.log('✅ Basic connection successful:', testQuery[0]);
    
    // Test 2: Pool connection
    console.log('Testing pool connection...');
    const pool = new Pool({ connectionString: databaseUrl });
    const poolResult = await pool.query('SELECT NOW() as pool_time');
    
    console.log('✅ Pool connection successful:', poolResult.rows[0]);
    
    // Test 3: Check if tables exist
    console.log('Checking for tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📊 Tables found:', tables.rows);
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection working!',
      envDebug,
      basicConnection: testQuery[0],
      poolConnection: poolResult.rows[0],
      tables: tables.rows,
      databaseUrlLength: databaseUrl.length
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      envDebug,
      databaseUrlLength: databaseUrl.length
    });
  }
} 