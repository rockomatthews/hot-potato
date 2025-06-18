import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserByWallet, 
  createUser, 
  isUsernameAvailable, 
  initializeDatabase,
  CreateUserProfile 
} from '@/lib/db';

// Initialize database on first request
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      dbInitialized = true;
    } catch {
      console.log('⚠️ Database initialization failed - running without profiles');
      dbInitialized = true; // Set to true to avoid retrying
    }
  }
}

// GET /api/users?wallet=<wallet_address>
export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();
    
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    // Try to get user, but handle database unavailability gracefully
    try {
      const user = await getUserByWallet(walletAddress);
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found', database_available: true },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ user });
    } catch {
      // Database is not available, return a response indicating this
      return NextResponse.json(
        { 
          error: 'Profile system temporarily unavailable', 
          database_available: false,
          wallet_address: walletAddress 
        },
        { status: 503 } // Service Unavailable
      );
    }
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users
export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();
    
    const body = await request.json();
    const { wallet_address, username, profile_picture_url }: CreateUserProfile = body;
    
    // Validation
    if (!wallet_address || !username) {
      return NextResponse.json(
        { error: 'Wallet address and username are required' },
        { status: 400 }
      );
    }
    
    // Validate username format (alphanumeric, underscores, hyphens, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens' },
        { status: 400 }
      );
    }
    
    try {
      // Check if user already exists
      const existingUser = await getUserByWallet(wallet_address);
      if (existingUser) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 409 }
        );
      }
      
      // Check if username is available
      const usernameAvailable = await isUsernameAvailable(username);
      if (!usernameAvailable) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        );
      }
      
      // Create user
      const user = await createUser({
        wallet_address,
        username,
        profile_picture_url
      });
      
      return NextResponse.json({ user }, { status: 201 });
    } catch {
      // Database is not available
      return NextResponse.json(
        { 
          error: 'Profile system temporarily unavailable - cannot create profiles at this time',
          database_available: false
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 