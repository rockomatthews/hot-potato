# 🔥 Hot Potato Game

A Solana-based gambling game where only one player loses and everyone else wins! Built with Next.js, Material UI, and Phantom wallet integration.

## 🎮 How to Play

1. **Connect Your Wallet**: Connect your Phantom wallet to join the game
2. **Set Your Buy-in**: Choose how much SOL you want to wager (minimum 1 SOL)
3. **Join the Game**: Click "Join Game" and wait for other players
4. **Wait for Game to Fill**: Games support 5-10 players (configurable)
5. **Game Starts Automatically**: Once the game is full, it starts automatically
6. **Hot Potato**: The game randomly selects one loser after 5 seconds
7. **Winners Split the Pot**: All other players split the total pot equally

## 🚀 Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

4. Connect your Phantom wallet and start playing!

## 🛠 Tech Stack

- **Next.js 14** - React framework with App Router
- **Material UI** - Modern React component library
- **Solana Web3.js** - Solana blockchain integration
- **Phantom Wallet Adapter** - Wallet connection and management
- **TypeScript** - Type safety
- **Emotion** - CSS-in-JS styling for Material UI

## 🎯 Game Features

- **Simple Interface**: Clean, modern UI with Material UI components
- **Wallet Integration**: Seamless Phantom wallet connection
- **Real-time Updates**: Live game state updates
- **Responsive Design**: Works on desktop and mobile
- **Game History**: View game results and winnings
- **Auto-start**: Games start automatically when full
- **Fair Random Selection**: Random loser selection for fairness

## ⚡ Game Rules

- **Minimum Players**: 5 players required to start
- **Maximum Players**: 10 players (configurable)
- **Buy-in**: Any whole number of SOL (minimum 1)
- **Winner Count**: All players except one (the loser)
- **Payout**: Winners split the total pot equally
- **Game Duration**: 5 seconds once started

## 🔒 Security Notes

- This is a **demo application** running on Solana Devnet
- **No real SOL** is transferred - this is for educational purposes only
- For production use, proper smart contracts and security audits would be required

## 📝 Development

To modify the game:

- Game logic is in `src/app/contexts/GameContext.tsx`
- UI components are in `src/app/components/HotPotatoGame.tsx`
- Wallet integration is in `src/app/contexts/WalletContextProvider.tsx`
- Material UI theme is configured in `src/app/layout.tsx`

## 🎨 Customization

You can easily customize:
- Player limits (min/max players)
- Game duration
- UI colors and themes
- Buy-in amounts
- Payout distribution

Enjoy playing Hot Potato! 🔥🥔

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
