-- ============================================
-- PHASE 3 COMPLETE DATABASE MIGRATION
-- CalorieWise - All Phase 3 Features
-- ============================================
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: NOTIFICATION SYSTEM
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

-- Notification Tokens Table (for push notifications)
CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Notifications Table
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 2: ACTIVITY FEED & SOCIAL
-- ============================================

-- Activity Feed Table
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'meal_logged', 'badge_earned', 'challenge_completed', 'streak_milestone', 'recipe_created'
  content JSONB NOT NULL,
  privacy TEXT DEFAULT 'friends' CHECK (privacy IN ('public', 'friends', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feed Reactions Table (likes, etc.)
CREATE TABLE IF NOT EXISTS feed_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feed_id UUID REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feed_id, user_id, reaction_type)
);

-- Feed Comments Table
CREATE TABLE IF NOT EXISTS feed_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feed_id UUID REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Privacy Settings Table
CREATE TABLE IF NOT EXISTS privacy_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  default_post_privacy TEXT DEFAULT 'friends' CHECK (default_post_privacy IN ('public', 'friends', 'private')),
  show_in_leaderboard BOOLEAN DEFAULT true,
  allow_friend_requests BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 3: MEAL PLANNING
-- ============================================

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

-- Meal Plan Items Table (already exists from Phase 2, but ensure it's there)
CREATE TABLE IF NOT EXISTS meal_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  meal_slot TEXT NOT NULL CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  template_id UUID REFERENCES meal_templates(id) ON DELETE SET NULL,
  custom_meal JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal Plan Templates Table
CREATE TABLE IF NOT EXISTS meal_plan_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  week_data JSONB NOT NULL, -- Stores the entire week's meal plan
  category TEXT, -- 'balanced', 'high_protein', 'low_carb', etc.
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 4: RECIPE SOCIAL FEATURES
-- ============================================

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

-- Recipe Favorites Table
CREATE TABLE IF NOT EXISTS recipe_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

-- Recipe Collections Table
CREATE TABLE IF NOT EXISTS recipe_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  recipe_ids UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 5: FITBIT INTEGRATION
-- ============================================

-- Fitbit Connections Table
CREATE TABLE IF NOT EXISTS fitbit_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  fitbit_user_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ
);

-- Fitbit Daily Data Table
CREATE TABLE IF NOT EXISTS fitbit_daily_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Calories & Activity
  calories_burned INTEGER,
  calories_bmr INTEGER,
  calories_active INTEGER,
  
  -- Activity Metrics
  steps INTEGER,
  distance_km DECIMAL(10, 2),
  floors INTEGER,
  active_minutes INTEGER,
  sedentary_minutes INTEGER,
  lightly_active_minutes INTEGER,
  fairly_active_minutes INTEGER,
  very_active_minutes INTEGER,
  
  -- Heart Rate
  resting_heart_rate INTEGER,
  avg_heart_rate INTEGER,
  
  -- Sleep
  sleep_minutes INTEGER,
  sleep_efficiency INTEGER,
  
  -- Body Measurements
  weight_kg DECIMAL(5, 2),
  body_fat_percent DECIMAL(5, 2),
  bmi DECIMAL(5, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- ============================================
-- PART 6: USER PREFERENCES & RECOMMENDATIONS
-- ============================================

-- User Preferences Table (for AI recommendations)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  dietary_restrictions TEXT[] DEFAULT '{}',
  favorite_cuisines TEXT[] DEFAULT '{}',
  disliked_ingredients TEXT[] DEFAULT '{}',
  meal_prep_time_preference TEXT, -- 'quick', 'medium', 'long'
  cooking_skill_level TEXT, -- 'beginner', 'intermediate', 'advanced'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal Recommendations Table
CREATE TABLE IF NOT EXISTS meal_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL, -- 'recipe', 'meal', 'restaurant'
  content JSONB NOT NULL,
  reason TEXT,
  shown BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 7: REFERRAL SYSTEM
-- ============================================

-- Referrals Table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  referred_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  bonus_awarded BOOLEAN DEFAULT false,
  bonus_points INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- PART 8: ADD COLUMNS TO PROFILES
-- ============================================

-- Add Fitbit and dynamic calorie columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fitbit_connected BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS use_dynamic_calories BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_bonus_points INTEGER DEFAULT 0;

-- ============================================
-- PART 9: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Notification Preferences RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Notification Tokens RLS
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification tokens"
  ON notification_tokens FOR ALL
  USING (auth.uid() = user_id);

-- Scheduled Notifications RLS
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled notifications"
  ON scheduled_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Activity Feed RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public and friends' activity"
  ON activity_feed FOR SELECT
  USING (
    privacy = 'public' OR
    (privacy = 'friends' AND user_id IN (
      SELECT friend_id FROM friendships WHERE user_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user_id FROM friendships WHERE friend_id = auth.uid() AND status = 'accepted'
    )) OR
    user_id = auth.uid()
  );

CREATE POLICY "Users can insert own activity"
  ON activity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity"
  ON activity_feed FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity"
  ON activity_feed FOR DELETE
  USING (auth.uid() = user_id);

-- Feed Reactions RLS
ALTER TABLE feed_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all reactions"
  ON feed_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can add own reactions"
  ON feed_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
  ON feed_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Feed Comments RLS
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all comments"
  ON feed_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can add own comments"
  ON feed_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON feed_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON feed_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Privacy Settings RLS
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own privacy settings"
  ON privacy_settings FOR ALL
  USING (auth.uid() = user_id);

-- Shopping Lists RLS
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own shopping lists"
  ON shopping_lists FOR ALL
  USING (auth.uid() = user_id);

-- Meal Plan Templates RLS
ALTER TABLE meal_plan_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public templates and own templates"
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

-- Recipe Reviews RLS
ALTER TABLE recipe_reviews ENABLE ROW LEVEL SECURITY;

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

-- Recipe Favorites RLS
ALTER TABLE recipe_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all favorites"
  ON recipe_favorites FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own favorites"
  ON recipe_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON recipe_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Recipe Collections RLS
ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public collections and own collections"
  ON recipe_collections FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can manage own collections"
  ON recipe_collections FOR ALL
  USING (auth.uid() = user_id);

-- Fitbit Connections RLS
ALTER TABLE fitbit_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fitbit connection"
  ON fitbit_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fitbit connection"
  ON fitbit_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fitbit connection"
  ON fitbit_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fitbit connection"
  ON fitbit_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Fitbit Daily Data RLS
ALTER TABLE fitbit_daily_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fitbit data"
  ON fitbit_daily_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fitbit data"
  ON fitbit_daily_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fitbit data"
  ON fitbit_daily_data FOR UPDATE
  USING (auth.uid() = user_id);

-- User Preferences RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Meal Recommendations RLS
ALTER TABLE meal_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON meal_recommendations FOR SELECT
  USING (auth.uid() = user_id);

-- Referrals RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can insert own referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- ============================================
-- PART 10: INDEXES FOR PERFORMANCE
-- ============================================

-- Notification Preferences Indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Notification Tokens Indexes
CREATE INDEX IF NOT EXISTS idx_notification_tokens_user_id ON notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_token ON notification_tokens(token);

-- Scheduled Notifications Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_sent ON scheduled_notifications(sent);

-- Activity Feed Indexes
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_privacy ON activity_feed(privacy);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type);

-- Feed Reactions Indexes
CREATE INDEX IF NOT EXISTS idx_feed_reactions_feed_id ON feed_reactions(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_user_id ON feed_reactions(user_id);

-- Feed Comments Indexes
CREATE INDEX IF NOT EXISTS idx_feed_comments_feed_id ON feed_comments(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_user_id ON feed_comments(user_id);

-- Shopping Lists Indexes
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_created_at ON shopping_lists(created_at DESC);

-- Meal Plan Items Indexes
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_plan_id ON meal_plan_items(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_recipe_id ON meal_plan_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_template_id ON meal_plan_items(template_id);

-- Meal Plan Templates Indexes
CREATE INDEX IF NOT EXISTS idx_meal_plan_templates_user_id ON meal_plan_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_templates_public ON meal_plan_templates(is_public);

-- Recipe Reviews Indexes
CREATE INDEX IF NOT EXISTS idx_recipe_reviews_recipe_id ON recipe_reviews(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_reviews_user_id ON recipe_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_reviews_rating ON recipe_reviews(rating);

-- Recipe Favorites Indexes
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_recipe_id ON recipe_favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user_id ON recipe_favorites(user_id);

-- Recipe Collections Indexes
CREATE INDEX IF NOT EXISTS idx_recipe_collections_user_id ON recipe_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_collections_public ON recipe_collections(is_public);

-- Fitbit Connections Indexes
CREATE INDEX IF NOT EXISTS idx_fitbit_connections_user_id ON fitbit_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_fitbit_connections_active ON fitbit_connections(is_active);

-- Fitbit Daily Data Indexes
CREATE INDEX IF NOT EXISTS idx_fitbit_daily_data_user_date ON fitbit_daily_data(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_fitbit_daily_data_date ON fitbit_daily_data(date DESC);

-- Referrals Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_email ON referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- ============================================
-- PART 11: TRIGGERS & FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_privacy_settings_updated_at ON privacy_settings;
CREATE TRIGGER update_privacy_settings_updated_at
  BEFORE UPDATE ON privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shopping_lists_updated_at ON shopping_lists;
CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meal_plan_templates_updated_at ON meal_plan_templates;
CREATE TRIGGER update_meal_plan_templates_updated_at
  BEFORE UPDATE ON meal_plan_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recipe_reviews_updated_at ON recipe_reviews;
CREATE TRIGGER update_recipe_reviews_updated_at
  BEFORE UPDATE ON recipe_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recipe_collections_updated_at ON recipe_collections;
CREATE TRIGGER update_recipe_collections_updated_at
  BEFORE UPDATE ON recipe_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fitbit_daily_data_updated_at ON fitbit_daily_data;
CREATE TRIGGER update_fitbit_daily_data_updated_at
  BEFORE UPDATE ON fitbit_daily_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = code) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to award referral bonus
CREATE OR REPLACE FUNCTION award_referral_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- Update referral record
  UPDATE referrals
  SET status = 'completed',
      referred_user_id = NEW.id,
      completed_at = NOW(),
      bonus_awarded = true
  WHERE referred_email = NEW.email
    AND status = 'pending';
  
  -- Award bonus points to referrer
  UPDATE profiles
  SET total_points = total_points + 50,
      referral_bonus_points = referral_bonus_points + 50,
      total_referrals = total_referrals + 1
  WHERE id IN (
    SELECT referrer_id FROM referrals 
    WHERE referred_email = NEW.email 
    AND status = 'completed'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to award referral bonus when new user signs up
DROP TRIGGER IF EXISTS award_referral_bonus_trigger ON profiles;
CREATE TRIGGER award_referral_bonus_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION award_referral_bonus();

-- ============================================
-- PART 12: COMMENTS & DOCUMENTATION
-- ============================================

COMMENT ON TABLE notification_preferences IS 'Stores user notification preferences for different notification types';
COMMENT ON TABLE notification_tokens IS 'Stores push notification tokens for devices';
COMMENT ON TABLE scheduled_notifications IS 'Stores scheduled notifications to be sent';
COMMENT ON TABLE activity_feed IS 'Stores user activity for social feed';
COMMENT ON TABLE feed_reactions IS 'Stores reactions (likes) on activity feed posts';
COMMENT ON TABLE feed_comments IS 'Stores comments on activity feed posts';
COMMENT ON TABLE privacy_settings IS 'Stores user privacy preferences';
COMMENT ON TABLE shopping_lists IS 'Stores shopping lists generated from meal plans';
COMMENT ON TABLE meal_plan_templates IS 'Stores reusable meal plan templates';
COMMENT ON TABLE recipe_reviews IS 'Stores user reviews and ratings for recipes';
COMMENT ON TABLE recipe_favorites IS 'Stores user favorite recipes';
COMMENT ON TABLE recipe_collections IS 'Stores user-created recipe collections';
COMMENT ON TABLE fitbit_connections IS 'Stores Fitbit OAuth tokens and connection status';
COMMENT ON TABLE fitbit_daily_data IS 'Stores daily Fitbit activity, heart rate, sleep, and body measurement data';
COMMENT ON TABLE user_preferences IS 'Stores user dietary preferences for AI recommendations';
COMMENT ON TABLE meal_recommendations IS 'Stores AI-generated meal recommendations';
COMMENT ON TABLE referrals IS 'Stores user referral invitations and tracking';

COMMENT ON COLUMN profiles.fitbit_connected IS 'Whether user has connected their Fitbit account';
COMMENT ON COLUMN profiles.use_dynamic_calories IS 'Whether to use Fitbit data for dynamic calorie calculations';
COMMENT ON COLUMN profiles.referral_code IS 'Unique referral code for this user';
COMMENT ON COLUMN profiles.total_referrals IS 'Total number of successful referrals';
COMMENT ON COLUMN profiles.referral_bonus_points IS 'Total bonus points earned from referrals';

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- 
-- Summary:
-- - 14 new tables created
-- - 5 new columns added to profiles
-- - Full RLS policies applied
-- - Performance indexes created
-- - Triggers and functions set up
-- - Referral system implemented
--
-- Next Steps:
-- 1. Run: supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
-- 2. Restart your dev server
-- 3. Test all Phase 3 features
--
-- ============================================
