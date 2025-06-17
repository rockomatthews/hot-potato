# 🚀 Hot Potato Game - Mainnet Deployment Guide

## 📋 Prerequisites

1. **Your Solana Wallet Address** for receiving house fees
2. **Vercel Account** (free tier works)
3. **Optional: Custom RPC Endpoint** for better performance on mainnet

## 🔧 Environment Configuration

### 1. Create Environment Files

Create a `.env.local` file in your project root:

```bash
# Solana Network Configuration
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_HOUSE_WALLET_ADDRESS=YOUR_ACTUAL_WALLET_ADDRESS_HERE
NEXT_PUBLIC_HOUSE_FEE_PERCENTAGE=0.03

# Optional: Custom RPC endpoint for better performance
# Recommended services: QuickNode, Alchemy, Helius
# NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://your-rpc-endpoint.com
```

### 2. Update GameContext with Your Wallet

Edit `src/app/contexts/GameContext.tsx`:

```javascript
// Replace this line:
const HOUSE_WALLET_ADDRESS = "YOUR_HOUSE_WALLET_ADDRESS_HERE";

// With your actual wallet address:
const HOUSE_WALLET_ADDRESS = "YourActualSolanaWalletAddress123...";
```

## 🌐 Vercel Deployment

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for mainnet deployment"
git push origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. **IMPORTANT: Configure Environment Variables**

In Vercel's project settings, add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SOLANA_NETWORK` | `mainnet-beta` | Solana network |
| `NEXT_PUBLIC_HOUSE_WALLET_ADDRESS` | `Your_Wallet_Address` | Your SOL address |
| `NEXT_PUBLIC_HOUSE_FEE_PERCENTAGE` | `0.03` | 3% house fee |
| `NEXT_PUBLIC_SOLANA_RPC_ENDPOINT` | `https://...` | (Optional) Custom RPC |

### Step 3: Deploy

Click "Deploy" and Vercel will automatically:
- Build your Next.js app
- Deploy to a global CDN
- Provide you with a live URL

## 🎯 Production Considerations

### 1. Custom RPC Endpoint (Recommended)

For production, use a paid RPC service for better reliability:

- **QuickNode**: `https://api.quicknode.com/...`
- **Alchemy**: `https://solana-mainnet.g.alchemy.com/...`
- **Helius**: `https://mainnet.helius-rpc.com/...`

### 2. Domain Configuration

1. Buy a domain (e.g., `hotpotato.game`)
2. In Vercel, go to Project Settings → Domains
3. Add your custom domain

### 3. Analytics & Monitoring

Consider adding:
- **Vercel Analytics** for performance monitoring
- **Google Analytics** for user tracking
- **Sentry** for error tracking

## 💰 House Fee System

The app automatically:
1. **Deducts 3%** from each player's buy-in
2. **Sends fees** to your specified wallet address
3. **Distributes remaining 97%** among winners

Example with 5 players at 1 SOL each:
- Total buy-ins: 5 SOL
- House fee (3%): 0.15 SOL → Your wallet
- Winner pot: 4.85 SOL → Split among 4 winners = 1.2125 SOL each

## 🔒 Security Notes

1. **Never commit** your private keys to GitHub
2. **Use environment variables** for all sensitive data
3. **Test thoroughly** on devnet before mainnet
4. **Monitor transactions** regularly

## 🧪 Testing Before Launch

### Local Testing with Mainnet

1. Update `.env.local`:
   ```
   NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
   ```

2. Test with small amounts first
3. Verify house fees are received correctly

### Devnet Testing

Keep a devnet version for testing:
```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

## 🚀 Go Live Checklist

- [ ] Environment variables configured in Vercel
- [ ] House wallet address updated and verified
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Analytics setup (optional)
- [ ] Legal pages added (Terms, Privacy Policy)
- [ ] Social media accounts created
- [ ] Marketing materials prepared

## 🎉 You're Live!

Once deployed, your Hot Potato game will be:
- ✅ Running on Solana mainnet
- ✅ Collecting 3% house fees automatically
- ✅ Accessible worldwide via your Vercel URL
- ✅ Fully responsive and mobile-friendly

**Your live URL will be something like:**
`https://hot-potato-game.vercel.app`

## 🆘 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test wallet connections
4. Monitor Solana network status

**Happy Gaming! 🔥🥔💰** 