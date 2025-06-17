# 🔥 Quick Setup - House Fee & Mainnet

## 1. 💰 Configure Your House Fee (3% automatic)

**Replace your wallet address** in `src/app/contexts/GameContext.tsx`:

```javascript
// Line 6: Replace this:
const HOUSE_WALLET_ADDRESS = "YOUR_HOUSE_WALLET_ADDRESS_HERE";

// With your actual Solana wallet address:
const HOUSE_WALLET_ADDRESS = "YourActualSolanaWalletAddress123...";
```

**How it works:**
- ✅ 3% of every buy-in automatically goes to your wallet
- ✅ Remaining 97% goes to the winner pot
- ✅ Example: 5 players × 1 SOL = 0.15 SOL to you, 4.85 SOL to winners

## 2. 🚀 Deploy to Mainnet with Vercel

### Option A: Quick Deploy (Devnet first)
1. Push to GitHub
2. Connect to Vercel
3. Deploy (will use devnet by default)

### Option B: Mainnet Deploy
1. Create `.env.local` file:
   ```
   NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
   NEXT_PUBLIC_HOUSE_WALLET_ADDRESS=YourWalletAddress
   ```
2. Push to GitHub
3. In Vercel, add the same environment variables
4. Deploy

## 🎯 That's it!

Your Hot Potato game will:
- ✅ Run on Solana mainnet
- ✅ Automatically collect 3% house fees
- ✅ Be accessible worldwide

For detailed instructions, see `DEPLOYMENT_GUIDE.md` 