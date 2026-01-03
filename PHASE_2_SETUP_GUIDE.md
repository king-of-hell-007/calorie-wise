# 📋 Phase 2 Manual Database Setup Guide

## Quick Setup Instructions

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run the Setup Script**
   - Click **New Query**
   - Copy the entire contents of `PHASE_2_COMPLETE_SETUP.sql`
   - Paste into the SQL editor
   - Click **Run** or press `Ctrl+Enter`

3. **Verify Success**
   - Check the output panel for success messages
   - Should see: "Phase 2 Setup Complete! Created 9 tables."
   - Navigate to **Table Editor** to see new tables

### Option 2: Supabase CLI

```bash
# Navigate to project directory
cd c:\anti\calorie-wise

# Run the SQL file
supabase db execute -f PHASE_2_COMPLETE_SETUP.sql

# Or use psql directly
psql -h YOUR_DB_HOST -U postgres -d postgres -f PHASE_2_COMPLETE_SETUP.sql
```

### Option 3: PostgreSQL Client

```bash
# Using psql
psql -h YOUR_SUPABASE_DB_HOST \
     -U postgres \
     -d postgres \
     -f PHASE_2_COMPLETE_SETUP.sql

# Enter your database password when prompted
```

---

## What Gets Created

### Tables (9 total):

**Phase 2A - Analytics & Management:**
1. `meal_templates` - Saved meal templates
2. `recipes` - User recipes
3. `recipe_ingredients` - Recipe ingredients
4. `analytics_cache` - Performance cache

**Phase 2B - Social & Community:**
5. `friendships` - Friend connections
6. `challenges` - Community challenges
7. `challenge_participants` - Challenge tracking

**Phase 2C - Smart Features:**
8. `water_log` - Water intake tracking
9. `barcode_cache` - Product data cache

### Profile Extensions:
- `username` field added to `profiles`
- `daily_water_goal_ml` field added to `profiles`

### Security:
- ✅ RLS enabled on all tables
- ✅ Policies for SELECT, INSERT, UPDATE, DELETE
- ✅ User isolation enforced
- ✅ Public data access controlled

### Sample Data:
- 3 pre-loaded challenges
- Ready to use immediately

---

## Verification Steps

### 1. Check Tables Were Created

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'meal_templates',
  'recipes',
  'recipe_ingredients',
  'analytics_cache',
  'friendships',
  'challenges',
  'challenge_participants',
  'water_log',
  'barcode_cache'
);
```

**Expected:** 9 rows returned

### 2. Check RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%template%' 
   OR tablename LIKE '%recipe%' 
   OR tablename LIKE '%friend%' 
   OR tablename LIKE '%challenge%' 
   OR tablename LIKE '%water%' 
   OR tablename LIKE '%barcode%';
```

**Expected:** All tables show `rowsecurity = true`

### 3. Check Sample Challenges

```sql
SELECT name, challenge_type, points_reward 
FROM challenges 
WHERE is_public = true;
```

**Expected:** 3 challenges (Streak Master, Protein Power, Hydration Hero)

### 4. Check Profile Extensions

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('username', 'daily_water_goal_ml');
```

**Expected:** 2 columns (username TEXT, daily_water_goal_ml INTEGER)

---

## After Setup

### 1. Regenerate TypeScript Types

```bash
# In your project directory
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

### 2. Restart Dev Server

```bash
npm run dev
```

### 3. Test Features

Visit these routes in your app:
- `/analytics` - Analytics Dashboard
- `/templates` - Meal Templates
- `/recipes` - Recipe Builder
- `/friends` - Friends System
- `/leaderboard` - Leaderboards
- `/challenges` - Challenges
- `/water` - Water Tracker
- `/barcode` - Barcode Scanner
- `/insights` - Smart Insights

---

## Troubleshooting

### Error: "relation already exists"
**Cause:** Tables already created
**Fix:** This is fine! The script uses `IF NOT EXISTS` so it's safe to run multiple times

### Error: "permission denied"
**Cause:** Insufficient database permissions
**Fix:** Ensure you're using the `postgres` role or service_role key

### Error: "column already exists"
**Cause:** Profile extensions already added
**Fix:** This is fine! The script uses `IF NOT EXISTS` for columns

### No sample challenges appear
**Cause:** Challenges may already exist
**Fix:** Check with `SELECT * FROM challenges;`

### RLS policies not working
**Cause:** User not authenticated
**Fix:** Ensure you're logged in with a valid user session

---

## Rollback (if needed)

If you need to remove Phase 2 tables:

```sql
-- WARNING: This will delete all Phase 2 data!
DROP TABLE IF EXISTS challenge_participants CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS meal_templates CASCADE;
DROP TABLE IF EXISTS analytics_cache CASCADE;
DROP TABLE IF EXISTS water_log CASCADE;
DROP TABLE IF EXISTS barcode_cache CASCADE;

-- Remove profile extensions
ALTER TABLE profiles DROP COLUMN IF EXISTS username;
ALTER TABLE profiles DROP COLUMN IF EXISTS daily_water_goal_ml;
```

---

## Next Steps

1. ✅ Run `PHASE_2_COMPLETE_SETUP.sql`
2. ✅ Verify tables created
3. ✅ Regenerate TypeScript types
4. ✅ Restart dev server
5. ✅ Test all 9 Phase 2 features
6. ✅ Enjoy your enhanced CalorieWise app!

---

## Support

If you encounter any issues:
1. Check the verification steps above
2. Review error messages carefully
3. Ensure database permissions are correct
4. Verify Supabase project is active

---

**File:** `PHASE_2_COMPLETE_SETUP.sql`
**Tables:** 9 new tables
**Policies:** 30+ RLS policies
**Features:** 9 major features
**Status:** Production Ready ✅
