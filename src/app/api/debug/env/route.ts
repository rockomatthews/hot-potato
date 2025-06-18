import { NextResponse } from 'next/server';

export async function GET() {
  // Get all environment variables
  const env = {
    // Database URLs
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
    POSTGRES_URL: process.env.POSTGRES_URL ? '✅ Set' : '❌ Missing',
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '✅ Set' : '❌ Missing',
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '✅ Set' : '❌ Missing',
    
    // Database components
    PGHOST: process.env.PGHOST ? '✅ Set' : '❌ Missing',
    POSTGRES_HOST: process.env.POSTGRES_HOST ? '✅ Set' : '❌ Missing',
    PGUSER: process.env.PGUSER ? '✅ Set' : '❌ Missing',
    POSTGRES_USER: process.env.POSTGRES_USER ? '✅ Set' : '❌ Missing',
    PGPASSWORD: process.env.PGPASSWORD ? '✅ Set' : '❌ Missing',
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ? '✅ Set' : '❌ Missing',
    PGDATABASE: process.env.PGDATABASE ? '✅ Set' : '❌ Missing',
    POSTGRES_DATABASE: process.env.POSTGRES_DATABASE ? '✅ Set' : '❌ Missing',
    
    // Solana config
    NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || '❌ Missing',
    NEXT_PUBLIC_HOUSE_WALLET_ADDRESS: process.env.NEXT_PUBLIC_HOUSE_WALLET_ADDRESS || '❌ Missing',
    NEXT_PUBLIC_HOUSE_FEE_PERCENTAGE: process.env.NEXT_PUBLIC_HOUSE_FEE_PERCENTAGE || '❌ Missing',
    NEXT_PUBLIC_SOLANA_RPC_ENDPOINT: process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || '❌ Missing',
    
    // Build info
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  };

  return NextResponse.json(env);
} 