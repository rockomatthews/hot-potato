import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserByWallet, 
  updateUser, 
  isUsernameAvailable,
  UpdateUserProfile 
} from '@/lib/db';

// PUT /api/users/[wallet]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const resolvedParams = await params;
    const walletAddress = resolvedParams.wallet;
    const body = await request.json();
    const { username, profile_picture_url }: UpdateUserProfile = body;
    
    // Check if user exists
    const existingUser = await getUserByWallet(walletAddress);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Validate username if provided
    if (username) {
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return NextResponse.json(
          { error: 'Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens' },
          { status: 400 }
        );
      }
      
      // Check if username is available (excluding current user)
      const usernameAvailable = await isUsernameAvailable(username, walletAddress);
      if (!usernameAvailable) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        );
      }
    }
    
    // Update user
    const updatedUser = await updateUser(walletAddress, {
      username,
      profile_picture_url
    });
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/users/[wallet]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const resolvedParams = await params;
    const walletAddress = resolvedParams.wallet;
    const user = await getUserByWallet(walletAddress);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 