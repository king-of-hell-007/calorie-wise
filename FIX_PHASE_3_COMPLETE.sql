-- ============================================
-- COMPLETE FIX FOR FRIENDS & PHASE 3 ISSUES
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: FIX PROFILES TABLE
-- ============================================

-- Add email column to profiles for friend search 
-- (it's separate from auth.users.email for privacy/discoverability)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak_days INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fitbit_connected BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS use_dynamic_calories BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_bonus_points INTEGER DEFAULT 0;

-- Create index for email search
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ============================================
-- PART 2: SYNC EMAIL FROM AUTH.USERS TO PROFILES
-- ============================================

-- Create function to get email from auth.users
CREATE OR REPLACE FUNCTION get_user_email(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = user_uuid;
  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing profiles with email from auth.users
UPDATE profiles 
SET email = get_user_email(id)
WHERE email IS NULL;

-- Create trigger to auto-populate email on new profile creation
CREATE OR REPLACE FUNCTION populate_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL THEN
    NEW.email := get_user_email(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS populate_profile_email_trigger ON profiles;
CREATE TRIGGER populate_profile_email_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION populate_profile_email();

-- ============================================
-- PART 3: FIX FRIENDSHIPS TABLE (Phase 2)
-- ============================================

-- Create friendships table if missing
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their friendships" ON friendships;
DROP POLICY IF EXISTS "Users can create friendships" ON friendships;
DROP POLICY IF EXISTS "Users can update their friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete their friendships" ON friendships;

-- Create RLS policies
CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friendships"
  ON friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ============================================
-- PART 4: FIX PHASE 3 TABLES
-- ============================================

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  meal_reminders BOOLEAN DEFAULT true,
  streak_reminders BOOLEAN DEFAULT true,
  challenge_updates BOOLEAN DEFAULT true,
  friend_activity BOOLEAN DEFAULT true,
  water_reminders BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Activity Feed Table
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  content JSONB NOT NULL,
  privacy TEXT DEFAULT 'friends' CHECK (privacy IN ('public', 'friends', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view public and friends' activity" ON activity_feed;
DROP POLICY IF EXISTS "Users can insert own activity" ON activity_feed;

CREATE POLICY "Users can view activity"
  ON activity_feed FOR SELECT
  USING (
    privacy = 'public' OR
    user_id = auth.uid() OR
    (privacy = 'friends' AND user_id IN (
      SELECT friend_id FROM friendships WHERE user_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user_id FROM friendships WHERE friend_id = auth.uid() AND status = 'accepted'
    ))
  );

CREATE POLICY "Users can insert own activity"
  ON activity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Shopping Lists Table
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  completed_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own shopping lists" ON shopping_lists;

CREATE POLICY "Users can manage own shopping lists"
  ON shopping_lists FOR ALL
  USING (auth.uid() = user_id);

-- Recipe Reviews Table
CREATE TABLE IF NOT EXISTS recipe_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

ALTER TABLE recipe_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all reviews" ON recipe_reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON recipe_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON recipe_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON recipe_reviews;

CREATE POLICY "Users can view all reviews"
  ON recipe_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own reviews"
  ON recipe_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON recipe_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON recipe_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Meal Plan Templates Table
CREATE TABLE IF NOT EXISTS meal_plan_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  week_data JSONB NOT NULL,
  category TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meal_plan_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view templates" ON meal_plan_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON meal_plan_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON meal_plan_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON meal_plan_templates;

CREATE POLICY "Users can view templates"
  ON meal_plan_templates FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can insert own templates"
  ON meal_plan_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON meal_plan_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON meal_plan_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Referrals Table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  referral_code TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  referred_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  bonus_awarded BOOLEAN DEFAULT false,
  bonus_points INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
DROP POLICY IF EXISTS "Users can insert own referrals" ON referrals;

CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can insert own referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- ============================================
-- PART 5: UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
DROP TRIGGER IF EXISTS update_friendships_updated_at ON friendships;
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  table_count INTEGER;
  profiles_has_email BOOLEAN;
BEGIN
  -- Check tables exist
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'friendships',
    'notification_preferences',
    'activity_feed',
    'shopping_lists',
    'recipe_reviews',
    'meal_plan_templates',
    'referrals'
  );
  
  -- Check email column exists
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) INTO profiles_has_email;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'FIX COMPLETE!';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Tables verified: % / 7', table_count;
  RAISE NOTICE 'Profiles has email column: %', profiles_has_email;
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Refresh your browser';
  RAISE NOTICE '2. Test the Friends feature';
  RAISE NOTICE '3. Search by username or email';
  RAISE NOTICE '==========================================';
END $$;
