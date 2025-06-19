import { NextResponse } from 'next/server';
import { initializeGameTables, initializeDatabase } from '@/lib/db';

export async function GET() {
  try {
    console.log('🔄 Initializing database tables via API...');
    
    // Initialize user profiles table
    await initializeDatabase();
    
    // Initialize game tables
    await initializeGameTables();
    
    console.log('✅ Database tables initialized successfully via API');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database tables initialized successfully',
      timestamp: new Date().toISOString(),
      tables: ['user_profiles', 'games', 'game_players', 'transactions']
    });
  } catch (error) {
    console.error('❌ Database initialization failed via API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
} 