# 🔥 Neon Database Setup for Hot Potato Game

This guide will help you set up Neon database for user profiles with usernames and avatars.

## 1. Create a Neon Account

1. Visit [Neon Console](https://console.neon.tech/)
2. Sign up for a free account
3. Create a new project

## 2. Get Your Database Connection String

1. In your Neon Console, go to your project dashboard
2. Click on "Connect" 
3. Copy the connection string - it looks like:
   ```
   postgresql://neondb_owner:your-password@ep-cool-name-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

## 3. Update Your Environment Variables

Add this to your `.env.local` file (create it if it doesn't exist):

```bash
# Existing Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_QUICKNODE_RPC_URL=your_quicknode_endpoint
NEXT_PUBLIC_HOUSE_WALLET_ADDRESS=CHyQpdkGgoQbQDdm9vgjc3NpiBQ9wQ8Fu8LHQaPwoNdN
NEXT_PUBLIC_HOUSE_FEE_PERCENTAGE=0.03

# NEW: Neon Database Configuration
DATABASE_URL=postgresql://your-neon-connection-string-here
```

## 4. What's New with User Profiles

### Features Added:
- 🎯 **Unique Usernames**: 3-20 characters, letters, numbers, underscore, hyphen
- 🎨 **Avatar Selection**: Choose from 32 emoji avatars (🔥, 🥔, 🎮, etc.)
- 🔄 **Automatic Profile Setup**: Shows setup dialog when wallet connects without profile
- ✏️ **Profile Editing**: Click profile menu to edit username/avatar
- 🏪 **Real-time Username Check**: Instant availability feedback

### Database Schema:
```sql
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  profile_picture_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints:
- `GET /api/users?wallet=<address>` - Get user profile
- `POST /api/users` - Create new profile
- `PUT /api/users/[wallet]` - Update profile
- `GET /api/users/check-username?username=<name>` - Check availability

## 5. How It Works

1. **First Time Users**: When a wallet connects without a profile, the setup dialog appears
2. **Profile Creation**: Users choose username and avatar, stored in Neon database
3. **Display**: Username and avatar shown in header instead of wallet address
4. **Profile Management**: Users can edit their profile anytime via the profile menu

## 6. Testing the Setup

1. Install dependencies: `npm install @neondatabase/serverless`
2. Set up your `.env.local` with DATABASE_URL
3. Run the app: `npm run dev`
4. Connect a new wallet - you should see the profile setup dialog
5. Create a profile and see it displayed in the header

## 7. Deployment Notes

When deploying to Vercel:
1. Add `DATABASE_URL` to your Vercel environment variables
2. The database table will be created automatically on first API call
3. Make sure your Neon database accepts connections from your deployment region

## 8. Neon Benefits

- ✅ **Serverless**: Pay only for what you use
- ✅ **Auto-scaling**: Handles traffic spikes automatically  
- ✅ **Branching**: Create database branches for testing
- ✅ **Built-in Connection Pooling**: No connection issues
- ✅ **PostgreSQL Compatible**: Full SQL support

---

🎉 **You're Ready!** Your Hot Potato game now has user profiles powered by Neon database! 