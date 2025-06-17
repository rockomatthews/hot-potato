# 🚀 QuickNode Setup for Hot Potato Game

## Why QuickNode?
- **Faster transactions** - Reduced latency for better user experience
- **Higher reliability** - 99.9% uptime vs public RPC issues
- **Better performance** - Dedicated resources for your app
- **Advanced features** - Analytics, monitoring, and more

## 🔧 Setup Steps

### 1. Create QuickNode Account
1. Go to [QuickNode.com](https://www.quicknode.com/)
2. Sign up for free account
3. Choose **Solana** blockchain
4. Select **Mainnet** network

### 2. Get Your Endpoint URL
1. In your QuickNode dashboard, copy your **HTTP Endpoint**
2. It will look like: `https://your-endpoint.solana-mainnet.quiknode.pro/your-api-key/`

### 3. Update Your .env.local
Replace the QuickNode line in your `.env.local` file:

```bash
# Replace this line:
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://YOUR_QUICKNODE_ENDPOINT_HERE.solana-mainnet.quiknode.pro/YOUR_API_KEY/

# With your actual QuickNode URL:
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://your-actual-endpoint.solana-mainnet.quiknode.pro/your-actual-api-key/
```

### 4. Complete .env.local File
Your complete `.env.local` should look like:

```bash
# Solana Mainnet Configuration
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# House Configuration  
NEXT_PUBLIC_HOUSE_WALLET_ADDRESS=CHyQpdkGgoQbQDdm9vgjc3NpiBQ9wQ8Fu8LHQaPwoNdN
NEXT_PUBLIC_HOUSE_FEE_PERCENTAGE=0.03

# QuickNode RPC Endpoint
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://your-actual-endpoint.solana-mainnet.quiknode.pro/your-actual-api-key/
```

## 🎯 Testing Your Setup

### 1. Check Console Logs
When you start your app (`npm run dev`), you should see:
```
🚀 Using custom RPC endpoint: QuickNode
🔥 Hot Potato - Wallet Configuration:
📡 Network: mainnet-beta
🏠 House wallet: CHyQpdkGgoQbQDdm9vgjc3NpiBQ9wQ8Fu8LHQaPwoNdN
💰 House fee: 0.03
```

### 2. Check Network Indicator
In your app header, you should see:
- **Green badge** saying "Mainnet (QuickNode)"
- **Pulsing animation** indicating live mainnet
- **Tooltip** explaining the configuration

## 🔒 Security Notes

- **Never commit** your QuickNode URL to GitHub
- **Keep your API key** secret
- **Monitor usage** in QuickNode dashboard
- **Set up alerts** for unusual activity

## 📊 QuickNode Benefits You'll See

- **Faster wallet connections**
- **Quicker transaction confirmations**
- **Less failed transactions**
- **Better user experience**
- **Detailed analytics** in QuickNode dashboard

## 💡 Pro Tips

1. **Monitor usage** - QuickNode provides detailed analytics
2. **Set up alerts** - Get notified of high usage or errors
3. **Use rate limits** - Protect against spam in production
4. **Consider upgrading** - Higher tiers offer more requests/second

## 🆘 Troubleshooting

### App shows "Mainnet" instead of "Mainnet (QuickNode)"
- Check your `.env.local` file
- Make sure the URL includes "quiknode"
- Restart your development server

### Transactions still slow?
- Verify you're using the HTTP endpoint (not WebSocket)
- Check QuickNode dashboard for errors
- Consider upgrading your QuickNode plan

### Network indicator not showing?
- Make sure you imported NetworkIndicator in Header.tsx
- Check browser console for errors
- Verify environment variables are loaded

**You're now running on QuickNode! 🚀** 