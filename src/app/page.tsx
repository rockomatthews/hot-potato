import HotPotatoGame from './components/HotPotatoGame';
import { initializeGameTables, initializeDatabase } from '@/lib/db';

// Server action to initialize database tables
async function initializeDatabaseTables() {
  'use server';
  
  try {
    console.log('🔄 Initializing database tables on server...');
    
    // Initialize user profiles table
    await initializeDatabase();
    
    // Initialize game tables
    await initializeGameTables();
    
    console.log('✅ Database tables initialized successfully on server');
    return { success: true };
  } catch (error) {
    console.error('❌ Database initialization failed on server:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export default async function Home() {
  // Initialize database tables on server side
  await initializeDatabaseTables();
  
  return <HotPotatoGame />;
}
