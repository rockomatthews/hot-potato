import { NextRequest, NextResponse } from 'next/server';
import { 
  saveGame, 
  saveGamePlayer, 
  saveTransaction,
  loadAllGames,
  initializeGameTables 
} from '@/lib/db';

// Initialize database on first request
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    try {
      await initializeGameTables();
      dbInitialized = true;
    } catch {
      console.log('⚠️ Game database initialization failed - running without persistence');
      dbInitialized = true; // Set to true to avoid retrying
    }
  }
}

// GET /api/games - Get all active games
export async function GET() {
  try {
    await ensureDbInitialized();
    
    const games = await loadAllGames();
    return NextResponse.json({ games });
  } catch (error) {
    console.error('Error loading games:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load games',
        games: [] // Return empty array as fallback
      },
      { status: 200 } // Still return 200 so app continues working
    );
  }
}

// POST /api/games - Create or update a game
export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();
    
    const body = await request.json();
    const { action, gameData, playerData, transactionData } = body;
    
    switch (action) {
      case 'create_game':
        await saveGame(gameData);
        return NextResponse.json({ success: true, message: 'Game created' });
        
      case 'join_game':
        await saveGamePlayer(playerData);
        if (gameData) {
          await saveGame(gameData); // Update game state
        }
        return NextResponse.json({ success: true, message: 'Player joined game' });
        
      case 'save_transaction':
        await saveTransaction(transactionData);
        return NextResponse.json({ success: true, message: 'Transaction saved' });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in games API:', error);
    return NextResponse.json(
      { success: false, error: 'Operation failed but app continues' },
      { status: 200 } // Don't break the app
    );
  }
} 