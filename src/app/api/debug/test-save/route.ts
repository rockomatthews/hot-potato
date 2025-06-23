import { NextResponse } from 'next/server';
import { saveGame, saveGamePlayer, saveTransaction, loadAllGames } from '@/lib/db';

export async function POST() {
  console.log('🎯 Testing game save functionality...');
  
  try {
    // Create a test game
    const testGame = {
      id: `test-${Date.now()}`,
      name: `Test Game ${Date.now()}`,
      creatorAddress: 'CHyQpdkGgoQbQDdm9vgjc3NpiBQ9wQ8Fu8LHQaPwoNdN',
      buyInAmount: 0.1,
      maxPlayers: 5,
      minPlayers: 3,
      totalPot: 0,
      houseFeeCollected: 0,
      gameStatus: 'waiting',
      escrowPublicKey: 'TestEscrowKey123456789',
      escrowSecretKey: [1, 2, 3, 4, 5],
      createdAt: Date.now(),
    };
    
    console.log('🔄 Saving test game:', testGame.id);
    await saveGame(testGame);
    
    // Add a test player
    const testPlayer = {
      gameId: testGame.id,
      playerAddress: 'CHyQpdkGgoQbQDdm9vgjc3NpiBQ9wQ8Fu8LHQaPwoNdN',
      buyInAmount: 0.1,
      transactionSignature: 'test-signature-123',
      paymentConfirmed: true,
      joinedAt: Date.now(),
    };
    
    console.log('🔄 Saving test player...');
    await saveGamePlayer(testPlayer);
    
    // Add a test transaction
    const testTransaction = {
      signature: 'test-transaction-123',
      transactionType: 'buy_in',
      amount: 0.1,
      fromAddress: 'CHyQpdkGgoQbQDdm9vgjc3NpiBQ9wQ8Fu8LHQaPwoNdN',
      toAddress: 'TestEscrowKey123456789',
      gameId: testGame.id,
      status: 'confirmed',
      blockTime: Date.now(),
    };
    
    console.log('🔄 Saving test transaction...');
    await saveTransaction(testTransaction);
    
    // Load all games to verify
    console.log('🔄 Loading all games...');
    const allGames = await loadAllGames();
    
    return NextResponse.json({
      status: 'success',
      message: 'Game save test completed successfully!',
      testGameId: testGame.id,
      allGamesCount: allGames.length,
      savedGame: allGames.find(g => g.id === testGame.id)
    });
    
  } catch (error) {
    console.error('❌ Game save test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Game save test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 