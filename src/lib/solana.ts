import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  Keypair
} from '@solana/web3.js';

// Get connection based on environment
export function getSolanaConnection(): Connection {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  const customRPC = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT;
  
  if (customRPC) {
    console.log('🚀 Using custom RPC endpoint:', customRPC.includes('quiknode') ? 'QuickNode' : 'Custom RPC');
    return new Connection(customRPC, 'confirmed');
  }
  
  const rpcUrl = network === 'mainnet-beta' 
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com';
    
  console.log('🌐 Using default Solana RPC for network:', network);
  return new Connection(rpcUrl, 'confirmed');
}

// Convert SOL to lamports
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

// Convert lamports to SOL
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

// Generate a unique escrow account for each game
export function generateGameEscrowAccount(): Keypair {
  return Keypair.generate();
}

// Create a transaction to transfer SOL to escrow
export function createEscrowDepositTransaction(
  fromPubkey: PublicKey,
  escrowPubkey: PublicKey,
  lamports: number,
  recentBlockhash: string
): Transaction {
  const transaction = new Transaction({ recentBlockhash, feePayer: fromPubkey });
  
  transaction.add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey: escrowPubkey,
      lamports,
    })
  );
  
  return transaction;
}

// Create a transaction to distribute winnings from escrow
export function createWinningDistributionTransaction(
  escrowAccount: Keypair,
  winnerPubkeys: PublicKey[],
  amountPerWinner: number,
  housePubkey: PublicKey,
  houseFee: number,
  recentBlockhash: string
): Transaction {
  const transaction = new Transaction({ recentBlockhash, feePayer: escrowAccount.publicKey });
  
  // Distribute to winners
  winnerPubkeys.forEach(winnerPubkey => {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: escrowAccount.publicKey,
        toPubkey: winnerPubkey,
        lamports: solToLamports(amountPerWinner),
      })
    );
  });
  
  // Send house fee
  if (houseFee > 0) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: escrowAccount.publicKey,
        toPubkey: housePubkey,
        lamports: solToLamports(houseFee),
      })
    );
  }
  
  return transaction;
}

// Check wallet balance
export async function getWalletBalance(publicKey: PublicKey): Promise<number> {
  const connection = getSolanaConnection();
  const lamports = await connection.getBalance(publicKey);
  return lamportsToSol(lamports);
}

// Verify transaction confirmation
export async function confirmTransaction(signature: string): Promise<boolean> {
  const connection = getSolanaConnection();
  try {
    const result = await connection.confirmTransaction(signature, 'confirmed');
    return !result.value.err;
  } catch (error) {
    console.error('Transaction confirmation error:', error);
    return false;
  }
}

// Send and confirm transaction
export async function sendAndConfirmTransaction(
  connection: Connection,
  transaction: Transaction,
  signers: Keypair[]
): Promise<string> {
  const signature = await connection.sendTransaction(transaction, signers, {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });
  
  await connection.confirmTransaction(signature, 'confirmed');
  return signature;
}

// Calculate game economics
export function calculateGamePayouts(
  buyInAmount: number,
  playerCount: number,
  houseFeePercentage: number
) {
  const totalBuyIn = buyInAmount * playerCount;
  const houseFeeTotal = totalBuyIn * houseFeePercentage;
  const totalPot = totalBuyIn - houseFeeTotal;
  const winnerCount = playerCount - 1; // Everyone except the loser
  const amountPerWinner = totalPot / winnerCount;
  
  return {
    totalBuyIn,
    houseFeeTotal,
    totalPot,
    winnerCount,
    amountPerWinner,
  };
} 