'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { UserProfile, CreateUserProfile, UpdateUserProfile } from '@/lib/db';

interface UserContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  hasProfile: boolean;
  createProfile: (data: Omit<CreateUserProfile, 'wallet_address'>) => Promise<UserProfile>;
  updateProfile: (data: UpdateUserProfile) => Promise<UserProfile>;
  checkUsernameAvailable: (username: string) => Promise<{ available: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = publicKey?.toString();

  // Fetch user profile
  const fetchProfile = useCallback(async (wallet: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users?wallet=${encodeURIComponent(wallet)}`);
      
      if (response.ok) {
        const { user } = await response.json();
        setUserProfile(user);
      } else if (response.status === 404) {
        // User doesn't exist yet
        setUserProfile(null);
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (walletAddress) {
      await fetchProfile(walletAddress);
    }
  }, [walletAddress, fetchProfile]);

  // Create new profile
  const createProfile = useCallback(async (data: Omit<CreateUserProfile, 'wallet_address'>): Promise<UserProfile> => {
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          ...data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create profile');
      }

      const { user } = await response.json();
      setUserProfile(user);
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Update profile
  const updateProfile = useCallback(async (data: UpdateUserProfile): Promise<UserProfile> => {
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users/${encodeURIComponent(walletAddress)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const { user } = await response.json();
      setUserProfile(user);
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Check username availability
  const checkUsernameAvailable = useCallback(async (username: string): Promise<{ available: boolean; error?: string }> => {
    try {
      const excludeParam = walletAddress ? `&exclude=${encodeURIComponent(walletAddress)}` : '';
      const response = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}${excludeParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to check username');
      }

      return await response.json();
    } catch (err) {
      console.error('Error checking username availability:', err);
      return {
        available: false,
        error: 'Failed to check username availability'
      };
    }
  }, [walletAddress]);

  // Load profile when wallet connects
  useEffect(() => {
    if (walletAddress) {
      fetchProfile(walletAddress);
    } else {
      setUserProfile(null);
      setLoading(false);
      setError(null);
    }
  }, [walletAddress, fetchProfile]);

  const hasProfile = !!userProfile;

  const value: UserContextType = {
    userProfile,
    loading,
    error,
    hasProfile,
    createProfile,
    updateProfile,
    checkUsernameAvailable,
    refreshProfile,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 