// Simple test script to verify database functionality
const { Pool } = require('@neondatabase/serverless');

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL || 
                   process.env.POSTGRES_URL || 
                   process.env.POSTGRES_URL_NON_POOLING ||
                   process.env.POSTGRES_PRISMA_URL;

if (!databaseUrl) {
  console.log('❌ No database URL found in environment variables');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection and tables...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_profiles', 'games', 'game_players', 'transactions')
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    console.log('📋 Existing tables:', existingTables);
    
    // Check if games table has the right structure
    if (existingTables.includes('games')) {
      const gamesStructureQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'games'
        ORDER BY ordinal_position;
      `;
      
      const gamesStructure = await client.query(gamesStructureQuery);
      console.log('🎮 Games table structure:');
      gamesStructure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
      // Check if there are any games
      const gamesCount = await client.query('SELECT COUNT(*) as count FROM games');
      console.log(`🎯 Number of games in database: ${gamesCount.rows[0].count}`);
    } else {
      console.log('❌ Games table not found!');
    }
    
    // Check if game_players table exists
    if (existingTables.includes('game_players')) {
      const playersCount = await client.query('SELECT COUNT(*) as count FROM game_players');
      console.log(`👥 Number of game players in database: ${playersCount.rows[0].count}`);
    } else {
      console.log('❌ Game players table not found!');
    }
    
    // Check if transactions table exists
    if (existingTables.includes('transactions')) {
      const transactionsCount = await client.query('SELECT COUNT(*) as count FROM transactions');
      console.log(`💰 Number of transactions in database: ${transactionsCount.rows[0].count}`);
    } else {
      console.log('❌ Transactions table not found!');
    }
    
    client.release();
    console.log('✅ Database test completed successfully');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testDatabase(); 