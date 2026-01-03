# CalorieWise - AI-Powered Nutrition Tracker

> A self-sufficient mobile-first nutrition tracking app powered by Google Gemini AI

## 🎯 Overview

CalorieWise is an intelligent nutrition tracking application that uses AI to analyze food images and provide detailed nutritional information. Simply snap a photo of your meal, and get instant calorie, protein, carbs, and fat breakdowns.

## ✨ Key Features

- 📸 **AI-Powered Image Analysis** - Upload food photos for instant nutritional analysis
- 🎯 **Personalized Goals** - Set and track custom calorie and macro targets
- 🔥 **Streak Tracking** - Build healthy habits with daily logging streaks
- 🏆 **Gamification** - Earn badges and points for consistent tracking
- 📊 **Progress Monitoring** - Visualize your nutrition journey over time
- 🔄 **API Key Rotation** - Automatic failover for high availability
- 📱 **Mobile Optimized** - Designed for seamless mobile experience

## 🚀 Recent Updates (Jan 2026)

**Major Architecture Improvement**: CalorieWise is now **fully self-sufficient**! 

We've eliminated the dependency on n8n by integrating Google Gemini API directly into the app. This means:
- ✅ No external workflow dependencies
- ✅ Reduced latency (2-5s vs 3-8s)
- ✅ Lower hosting costs ($0-25/month vs $10-75/month)
- ✅ Simpler deployment and maintenance
- ✅ Built-in API key rotation and failover

📖 **Read more**: [N8N_MIGRATION.md](./N8N_MIGRATION.md) | [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn-ui + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: Google Gemini 2.0 Flash (Vision + Text)
- **Charts**: Recharts
- **State Management**: React Query

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Gemini API key(s) - [Get one here](https://aistudio.google.com/app/apikey)

## 🏁 Quick Start

### 1. Clone and Install

```bash
git clone <YOUR_GIT_URL>
cd calorie-wise
npm install
```

### 2. Configure Environment

Create a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### 3. Setup Database

Apply the database schema and migrations:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL files in Supabase Dashboard:
# 1. calorie-wise-database-schema.sql
# 2. supabase/migrations/20260101_update_api_keys_rls.sql
```

### 4. Add Gemini API Keys

1. Start the dev server: `npm run dev`
2. Navigate to `/admin`
3. Add your Gemini API key(s)
4. Recommended: Add 2-3 keys for automatic failover

### 5. Start Tracking!

Navigate to `/analyze` and upload your first food photo! 🎉

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[N8N_MIGRATION.md](./N8N_MIGRATION.md)** - Migration details and benefits
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture diagrams and comparisons
- **[SUPABASE_MIGRATION_INSTRUCTIONS.md](./SUPABASE_MIGRATION_INSTRUCTIONS.md)** - Database setup

## 🏗️ Project Structure

```
calorie-wise/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components (Dashboard, Analyze, etc.)
│   ├── services/         # Business logic (geminiService, etc.)
│   ├── integrations/     # Supabase client and types
│   └── hooks/            # Custom React hooks
├── supabase/
│   ├── functions/        # Edge functions (optional)
│   └── migrations/       # Database migrations
└── public/               # Static assets
```

## 🔑 Key Components

- **`src/services/geminiService.ts`** - Direct Gemini API integration with key rotation
- **`src/pages/Analyze.tsx`** - Image upload and nutrition analysis
- **`src/pages/Dashboard.tsx`** - Main dashboard with daily stats
- **`src/pages/Admin.tsx`** - API key management panel
- **`src/pages/Profile.tsx`** - User profile and settings

## 🎮 Usage

1. **Onboarding**: Set your age, weight, height, activity level, and goals
2. **Analyze**: Upload food photos to get nutritional data
3. **Track**: Log meals throughout the day
4. **Monitor**: View progress on the dashboard
5. **Earn**: Unlock badges and earn points for consistency

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- API keys stored in database (consider encryption for production)
- Admin-only access for API key management
- Authenticated users can only access their own data

## 🚀 Deployment

### Deploy to Lovable

Simply open [Lovable](https://lovable.dev/projects/fa9146b6-6a8b-41fa-8dfb-573ea7b97d23) and click on Share → Publish.

### Deploy to Vercel/Netlify

```bash
npm run build
# Deploy the dist/ folder
```

### Environment Variables

Ensure these are set in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is built with Lovable and uses various open-source libraries.

## 🙏 Acknowledgments

- Google Gemini AI for nutrition analysis
- Supabase for backend infrastructure
- shadcn-ui for beautiful components
- Lovable for rapid development

## 📞 Support

For issues or questions:
1. Check the documentation files
2. Review the browser console for errors
3. Verify API keys are active in `/admin`
4. Ensure database migrations are applied

---

**Made with ❤️ using Lovable**
