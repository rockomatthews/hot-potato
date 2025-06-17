import { NextRequest, NextResponse } from 'next/server';
import { isUsernameAvailable } from '@/lib/db';

// GET /api/users/check-username?username=<username>&exclude=<wallet_address>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const excludeWallet = searchParams.get('exclude');
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }
    
    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({
        available: false,
        error: 'Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens'
      });
    }
    
    const available = await isUsernameAvailable(username, excludeWallet || undefined);
    
    return NextResponse.json({ 
      available,
      username
    });
  } catch (error) {
    console.error('Error checking username availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 