import { NextResponse } from 'next/server';
import { initializeGameTables, initializeDatabase } from '@/lib/db';

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
  try {
    console.log('🔄 Checking database tables...');
    
    // Initialize user profiles table
    await initializeDatabase();
    
    // Initialize game tables
    await initializeGameTables();
    
    console.log('✅ Database tables check completed');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database tables are ready',
      tables: ['user_profiles', 'games', 'game_players', 'transactions']
    });
  } catch (error) {
    console.error('❌ Database check failed:', error);
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