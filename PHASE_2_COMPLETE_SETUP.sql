-- ============================================================================
-- CALORIEWISE - COMPLETE PHASE 2 DATABASE SETUP
-- ============================================================================
-- This script sets up all Phase 2 features including:
-- - Phase 2A: Analytics, Meal Templates, Recipes
-- - Phase 2B: Friends, Leaderboards, Challenges
-- - Phase 2C: Water Tracking, Barcode Scanner, Smart Insights
-- ============================================================================

-- ============================================================================
-- 1. PHASE 2A: ANALYTICS & MANAGEMENT
-- ============================================================================

-- Meal Templates Table
CREATE TABLE IF NOT EXISTS meal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  meal_slot TEXT CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  nutrition_data JSONB NOT NULL,
  image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_templates_user_id ON meal_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_templates_meal_slot ON meal_templates(meal_slot);

COMMENT ON TABLE meal_templates IS 'Saved meal templates for quick logging';

-- Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  servings INTEGER NOT NULL DEFAULT 1,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  instructions TEXT,
  tags TEXT[],
  image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);

COMMENT ON TABLE recipes IS 'User-created recipes';

-- Recipe Ingredients Table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  ingredient_name TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  calories DECIMAL NOT NULL DEFAULT 0,
  protein DECIMAL NOT NULL DEFAULT 0,
  carbs DECIMAL NOT NULL DEFAULT 0,
  fat DECIMAL NOT NULL DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);

COMMENT ON TABLE recipe_ingredients IS 'Ingredients for recipes with nutrition data';

-- Analytics Cache Table (for performance optimization)
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cache_key TEXT NOT NULL,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_cache_user_key ON analytics_cache(user_id, cache_key);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON analytics_cache(expires_at);

COMMENT ON TABLE analytics_cache IS 'Cached analytics data for performance';

-- ============================================================================
-- 2. PHASE 2B: SOCIAL & COMMUNITY
-- ============================================================================

-- Friendships Table
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

CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

COMMENT ON TABLE friendships IS 'User friendships and friend requests';

-- Challenges Table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT CHECK (challenge_type IN ('streak', 'calories', 'protein', 'steps', 'water', 'custom')) NOT NULL,
  target_value DECIMAL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  badge_icon TEXT,
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenges_public ON challenges(is_public);

COMMENT ON TABLE challenges IS 'Community challenges';

-- Challenge Participants Table
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  current_progress DECIMAL DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_completed ON challenge_participants(completed);

COMMENT ON TABLE challenge_participants IS 'User participation in challenges';

-- ============================================================================
-- 3. PHASE 2C: SMART FEATURES
-- ============================================================================

-- Water Log Table
CREATE TABLE IF NOT EXISTS water_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount_ml INTEGER NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_log_user_id ON water_log(user_id);
CREATE INDEX IF NOT EXISTS idx_water_log_logged_at ON water_log(logged_at);

COMMENT ON TABLE water_log IS 'Daily water intake tracking';

-- Barcode Cache Table
CREATE TABLE IF NOT EXISTS barcode_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT,
  nutrition_data JSONB NOT NULL,
  image_url TEXT,
  verified BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'openfoodfacts',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barcode_cache_barcode ON barcode_cache(barcode);
CREATE INDEX IF NOT EXISTS idx_barcode_cache_verified ON barcode_cache(verified);

COMMENT ON TABLE barcode_cache IS 'Cached barcode product data';

-- ============================================================================
-- 4. PROFILE EXTENSIONS
-- ============================================================================

-- Add username field for friend search
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
COMMENT ON COLUMN profiles.username IS 'Unique username for friend search and social features';

-- Add daily water goal field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_water_goal_ml INTEGER DEFAULT 2000;
COMMENT ON COLUMN profiles.daily_water_goal_ml IS 'Daily water intake goal in milliliters (default 2000ml = 2L)';

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcode_cache ENABLE ROW LEVEL SECURITY;

-- Meal Templates Policies
CREATE POLICY "Users can view their own meal templates"
  ON meal_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal templates"
  ON meal_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal templates"
  ON meal_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal templates"
  ON meal_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Recipes Policies
CREATE POLICY "Users can view their own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);

-- Recipe Ingredients Policies
CREATE POLICY "Users can view ingredients of their recipes"
  ON recipe_ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND (recipes.user_id = auth.uid() OR recipes.is_public = true)
  ));

CREATE POLICY "Users can insert ingredients to their recipes"
  ON recipe_ingredients FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND recipes.user_id = auth.uid()
  ));

CREATE POLICY "Users can update ingredients of their recipes"
  ON recipe_ingredients FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND recipes.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete ingredients from their recipes"
  ON recipe_ingredients FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND recipes.user_id = auth.uid()
  ));

-- Analytics Cache Policies
CREATE POLICY "Users can view their own analytics cache"
  ON analytics_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics cache"
  ON analytics_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics cache"
  ON analytics_cache FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analytics cache"
  ON analytics_cache FOR DELETE
  USING (auth.uid() = user_id);

-- Friendships Policies
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

-- Challenges Policies
CREATE POLICY "Anyone can view public challenges"
  ON challenges FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Authenticated users can create challenges"
  ON challenges FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Challenge creators can update their challenges"
  ON challenges FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Challenge creators can delete their challenges"
  ON challenges FOR DELETE
  USING (auth.uid() = created_by);

-- Challenge Participants Policies
CREATE POLICY "Users can view challenge participants"
  ON challenge_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join challenges"
  ON challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation"
  ON challenge_participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave challenges"
  ON challenge_participants FOR DELETE
  USING (auth.uid() = user_id);

-- Water Log Policies
CREATE POLICY "Users can view their own water logs"
  ON water_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water logs"
  ON water_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water logs"
  ON water_log FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water logs"
  ON water_log FOR DELETE
  USING (auth.uid() = user_id);

-- Barcode Cache Policies (public read, authenticated write)
CREATE POLICY "Anyone can view barcode cache"
  ON barcode_cache FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert barcode cache"
  ON barcode_cache FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update barcode cache"
  ON barcode_cache FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 6. TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_meal_templates_updated_at
  BEFORE UPDATE ON meal_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barcode_cache_updated_at
  BEFORE UPDATE ON barcode_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. SAMPLE DATA (CHALLENGES)
-- ============================================================================

-- Insert sample challenges (only if they don't exist)
INSERT INTO challenges (name, description, challenge_type, target_value, start_date, end_date, points_reward, is_public)
VALUES 
  ('30-Day Streak Master', 'Log your meals every day for 30 consecutive days', 'streak', 30, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 500, true),
  ('Protein Power Week', 'Hit your protein goal every day for 7 days', 'protein', 7, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 200, true),
  ('Hydration Hero', 'Drink 2L of water daily for 14 days', 'water', 28000, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 300, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. CLEANUP OLD CACHE DATA (FUNCTION)
-- ============================================================================

-- Function to clean up expired analytics cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM analytics_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PHASE 2 SETUP COMPLETE
-- ============================================================================

-- Verify tables were created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
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
  
  RAISE NOTICE 'Phase 2 Setup Complete! Created % tables.', table_count;
  RAISE NOTICE 'All RLS policies have been applied.';
  RAISE NOTICE 'Sample challenges have been added.';
  RAISE NOTICE 'Phase 2 features are ready to use!';
END $$;
