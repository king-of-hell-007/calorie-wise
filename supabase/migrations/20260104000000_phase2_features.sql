-- Phase 2 Database Migration
-- CalorieWise Advanced Features

-- ============================================================================
-- 1. MEAL TEMPLATES
-- ============================================================================

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

CREATE INDEX idx_meal_templates_user_id ON meal_templates(user_id);
CREATE INDEX idx_meal_templates_meal_slot ON meal_templates(meal_slot);

-- ============================================================================
-- 2. RECIPES
-- ============================================================================

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  servings INTEGER DEFAULT 1 CHECK (servings > 0),
  prep_time_minutes INTEGER CHECK (prep_time_minutes >= 0),
  cook_time_minutes INTEGER CHECK (cook_time_minutes >= 0),
  instructions TEXT,
  image_url TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  ingredient_name TEXT NOT NULL,
  quantity DECIMAL(10, 2),
  unit TEXT,
  calories INTEGER DEFAULT 0,
  protein DECIMAL(10, 2) DEFAULT 0,
  carbs DECIMAL(10, 2) DEFAULT 0,
  fat DECIMAL(10, 2) DEFAULT 0,
  display_order INTEGER DEFAULT 0
);

CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);

-- ============================================================================
-- 3. MEAL PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_date DATE NOT NULL,
  meal_slot TEXT CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  meal_template_id UUID REFERENCES meal_templates(id) ON DELETE SET NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_date, meal_slot)
);

CREATE INDEX idx_meal_plans_user_date ON meal_plans(user_id, plan_date);

-- ============================================================================
-- 4. FRIENDSHIPS & SOCIAL
-- ============================================================================

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

CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- ============================================================================
-- 5. CHALLENGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT CHECK (challenge_type IN ('streak', 'calories', 'protein', 'steps', 'water', 'custom')) NOT NULL,
  target_value INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date >= start_date),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  badge_icon TEXT,
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX idx_challenge_participants_user_id ON challenge_participants(user_id);
CREATE INDEX idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);

-- ============================================================================
-- 6. WATER TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS water_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_water_log_user_date ON water_log(user_id, logged_at);

-- Add water goal to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_water_goal_ml INTEGER DEFAULT 2000;

-- ============================================================================
-- 7. BARCODE CACHE
-- ============================================================================

CREATE TABLE IF NOT EXISTS barcode_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT,
  nutrition_data JSONB NOT NULL,
  image_url TEXT,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES profiles(id),
  source TEXT DEFAULT 'openfoodfacts',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_barcode_cache_barcode ON barcode_cache(barcode);

-- ============================================================================
-- 8. ANALYTICS CACHE
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cache_key TEXT NOT NULL,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cache_key)
);

CREATE INDEX idx_analytics_cache_user_key ON analytics_cache(user_id, cache_key);
CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);

-- ============================================================================
-- 9. RLS POLICIES
-- ============================================================================

-- Meal Templates
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal templates"
ON meal_templates FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own meal templates"
ON meal_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal templates"
ON meal_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal templates"
ON meal_templates FOR DELETE
USING (auth.uid() = user_id);

-- Recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recipes"
ON recipes FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own recipes"
ON recipes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
ON recipes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
ON recipes FOR DELETE
USING (auth.uid() = user_id);

-- Recipe Ingredients
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recipe ingredients"
ON recipe_ingredients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND (recipes.user_id = auth.uid() OR recipes.is_public = true)
  )
);

CREATE POLICY "Users can manage own recipe ingredients"
ON recipe_ingredients FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND recipes.user_id = auth.uid()
  )
);

-- Meal Plans
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own meal plans"
ON meal_plans FOR ALL
USING (auth.uid() = user_id);

-- Friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships"
ON friendships FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
ON friendships FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friendships"
ON friendships FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete own friendships"
ON friendships FOR DELETE
USING (auth.uid() = user_id);

-- Challenges
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public challenges"
ON challenges FOR SELECT
USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create challenges"
ON challenges FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update own challenges"
ON challenges FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete own challenges"
ON challenges FOR DELETE
USING (auth.uid() = created_by);

-- Challenge Participants
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view challenge participants"
ON challenge_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM challenges
    WHERE challenges.id = challenge_participants.challenge_id
    AND (challenges.is_public = true OR challenges.created_by = auth.uid())
  )
);

CREATE POLICY "Users can join challenges"
ON challenge_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
ON challenge_participants FOR UPDATE
USING (auth.uid() = user_id);

-- Water Log
ALTER TABLE water_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own water log"
ON water_log FOR ALL
USING (auth.uid() = user_id);

-- Barcode Cache
ALTER TABLE barcode_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view barcode cache"
ON barcode_cache FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can add to barcode cache"
ON barcode_cache FOR INSERT
TO authenticated
WITH CHECK (true);

-- Analytics Cache
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own analytics cache"
ON analytics_cache FOR ALL
USING (auth.uid() = user_id);

-- ============================================================================
-- 10. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meal_templates_updated_at BEFORE UPDATE ON meal_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample public challenges
INSERT INTO challenges (name, description, challenge_type, target_value, start_date, end_date, is_public, points_reward)
VALUES
  ('30-Day Streak Master', 'Log meals for 30 consecutive days', 'streak', 30, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', true, 500),
  ('Protein Power Week', 'Hit your protein goal for 7 days straight', 'protein', 7, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', true, 200),
  ('Hydration Hero', 'Drink 2L of water daily for 14 days', 'water', 14, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', true, 300)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE meal_templates IS 'User-created meal templates for quick logging';
COMMENT ON TABLE recipes IS 'User recipes with ingredients and instructions';
COMMENT ON TABLE meal_plans IS 'Weekly meal planning calendar';
COMMENT ON TABLE friendships IS 'User friendship connections';
COMMENT ON TABLE challenges IS 'Community and personal challenges';
COMMENT ON TABLE water_log IS 'Daily water intake tracking';
COMMENT ON TABLE barcode_cache IS 'Cached barcode nutrition data';
COMMENT ON TABLE analytics_cache IS 'Performance cache for analytics queries';
