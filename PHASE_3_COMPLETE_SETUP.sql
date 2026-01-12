-- ============================================================================
-- CALORIEWISE - PHASE 3 DATABASE SETUP
-- ============================================================================
-- Advanced Features & PWA Support
-- ============================================================================

-- ============================================================================
-- 1. NOTIFICATION SYSTEM
-- ============================================================================

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  meal_reminders BOOLEAN DEFAULT true,
  streak_reminders BOOLEAN DEFAULT true,
  challenge_updates BOOLEAN DEFAULT true,
  friend_activity BOOLEAN DEFAULT true,
  water_reminders BOOLEAN DEFAULT true,
  reminder_times JSONB DEFAULT '{"breakfast": "08:00", "lunch": "12:00", "dinner": "18:00", "water": ["10:00", "14:00", "18:00"]}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Tokens (for push notifications)
CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  device_type TEXT,
  device_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_tokens_user ON notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_token ON notification_tokens(token);

-- Scheduled Notifications
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_sent ON scheduled_notifications(sent);

-- ============================================================================
-- 2. ACTIVITY FEED & SOCIAL
-- ============================================================================

-- Activity Feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('meal_logged', 'badge_earned', 'challenge_completed', 'streak_milestone', 'recipe_created', 'goal_achieved')),
  content JSONB NOT NULL,
  privacy TEXT DEFAULT 'friends' CHECK (privacy IN ('public', 'friends', 'private')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_privacy ON activity_feed(privacy);

-- Feed Reactions
CREATE TABLE IF NOT EXISTS feed_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID REFERENCES activity_feed(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'fire', 'clap', 'strong')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feed_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_reactions_feed ON feed_reactions(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_user ON feed_reactions(user_id);

-- Feed Comments
CREATE TABLE IF NOT EXISTS feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID REFERENCES activity_feed(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_comments_feed ON feed_comments(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_user ON feed_comments(user_id);

-- ============================================================================
-- 3. MEAL PLANNING & SHOPPING
-- ============================================================================

-- Shopping Lists
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_items JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_user ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_active ON shopping_lists(is_active);

-- Meal Plan Items (extends existing meal_plans table)
CREATE TABLE IF NOT EXISTS meal_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  meal_slot TEXT CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  template_id UUID REFERENCES meal_templates(id) ON DELETE SET NULL,
  custom_meal JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_plan_items_plan ON meal_plan_items(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_day ON meal_plan_items(day_of_week);

-- ============================================================================
-- 4. RECIPE SOCIAL FEATURES
-- ============================================================================

-- Recipe Reviews
CREATE TABLE IF NOT EXISTS recipe_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_reviews_recipe ON recipe_reviews(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_reviews_user ON recipe_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_reviews_rating ON recipe_reviews(rating);

-- Recipe Favorites
CREATE TABLE IF NOT EXISTS recipe_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_favorites_recipe ON recipe_favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user ON recipe_favorites(user_id);

-- Recipe Collections
CREATE TABLE IF NOT EXISTS recipe_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  recipe_ids UUID[] DEFAULT ARRAY[]::UUID[],
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_collections_user ON recipe_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_collections_public ON recipe_collections(is_public);

-- ============================================================================
-- 5. USER PREFERENCES & SETTINGS
-- ============================================================================

-- User Preferences (for AI recommendations)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  dietary_restrictions TEXT[] DEFAULT ARRAY[]::TEXT[],
  allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
  disliked_foods TEXT[] DEFAULT ARRAY[]::TEXT[],
  favorite_cuisines TEXT[] DEFAULT ARRAY[]::TEXT[],
  meal_prep_time_preference TEXT CHECK (meal_prep_time_preference IN ('quick', 'moderate', 'elaborate')),
  budget_preference TEXT CHECK (budget_preference IN ('budget', 'moderate', 'premium')),
  cooking_skill_level TEXT CHECK (cooking_skill_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Privacy Settings
CREATE TABLE IF NOT EXISTS privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  profile_visibility TEXT DEFAULT 'friends' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  show_activity_feed BOOLEAN DEFAULT true,
  show_on_leaderboard BOOLEAN DEFAULT true,
  allow_friend_requests BOOLEAN DEFAULT true,
  show_meal_photos BOOLEAN DEFAULT true,
  show_achievements BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. AI RECOMMENDATIONS
-- ============================================================================

-- Meal Recommendations
CREATE TABLE IF NOT EXISTS meal_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recommendation_type TEXT CHECK (recommendation_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'recipe')),
  recommended_item JSONB NOT NULL,
  reason TEXT,
  confidence_score DECIMAL(3,2),
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted BOOLEAN,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_recommendations_user ON meal_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_recommendations_type ON meal_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_meal_recommendations_shown ON meal_recommendations(shown_at DESC);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_recommendations ENABLE ROW LEVEL SECURITY;

-- Notification Preferences Policies
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Notification Tokens Policies
CREATE POLICY "Users can manage own notification tokens"
  ON notification_tokens FOR ALL
  USING (auth.uid() = user_id);

-- Activity Feed Policies
CREATE POLICY "Users can view public and friends' activity"
  ON activity_feed FOR SELECT
  USING (
    privacy = 'public' OR
    user_id = auth.uid() OR
    (privacy = 'friends' AND EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_id = auth.uid() AND friend_id = activity_feed.user_id AND status = 'accepted')
         OR (friend_id = auth.uid() AND user_id = activity_feed.user_id AND status = 'accepted')
    ))
  );

CREATE POLICY "Users can create own activity"
  ON activity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity"
  ON activity_feed FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity"
  ON activity_feed FOR DELETE
  USING (auth.uid() = user_id);

-- Feed Reactions Policies
CREATE POLICY "Users can view all reactions"
  ON feed_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can add reactions"
  ON feed_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
  ON feed_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Feed Comments Policies
CREATE POLICY "Users can view all comments"
  ON feed_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can add comments"
  ON feed_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON feed_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON feed_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Shopping Lists Policies
CREATE POLICY "Users can manage own shopping lists"
  ON shopping_lists FOR ALL
  USING (auth.uid() = user_id);

-- Meal Plan Items Policies
CREATE POLICY "Users can manage own meal plan items"
  ON meal_plan_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND meal_plans.user_id = auth.uid()
  ));

-- Recipe Reviews Policies
CREATE POLICY "Users can view all reviews"
  ON recipe_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews"
  ON recipe_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON recipe_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON recipe_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Recipe Favorites Policies
CREATE POLICY "Users can manage own favorites"
  ON recipe_favorites FOR ALL
  USING (auth.uid() = user_id);

-- Recipe Collections Policies
CREATE POLICY "Users can view public collections and own collections"
  ON recipe_collections FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can create own collections"
  ON recipe_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON recipe_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON recipe_collections FOR DELETE
  USING (auth.uid() = user_id);

-- User Preferences Policies
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Privacy Settings Policies
CREATE POLICY "Users can manage own privacy settings"
  ON privacy_settings FOR ALL
  USING (auth.uid() = user_id);

-- Meal Recommendations Policies
CREATE POLICY "Users can view own recommendations"
  ON meal_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON meal_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- Update timestamp triggers
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feed_comments_updated_at
  BEFORE UPDATE ON feed_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_reviews_updated_at
  BEFORE UPDATE ON recipe_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_collections_updated_at
  BEFORE UPDATE ON recipe_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_privacy_settings_updated_at
  BEFORE UPDATE ON privacy_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. FUNCTIONS
-- ============================================================================

-- Function to get user's activity feed
CREATE OR REPLACE FUNCTION get_user_feed(target_user_id UUID, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  activity_type TEXT,
  content JSONB,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  user_profile JSONB,
  reaction_count INTEGER,
  comment_count INTEGER,
  user_reacted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    af.id,
    af.user_id,
    af.activity_type,
    af.content,
    af.image_url,
    af.created_at,
    jsonb_build_object(
      'username', p.username,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url
    ) as user_profile,
    (SELECT COUNT(*)::INTEGER FROM feed_reactions WHERE feed_id = af.id) as reaction_count,
    (SELECT COUNT(*)::INTEGER FROM feed_comments WHERE feed_id = af.id) as comment_count,
    EXISTS(SELECT 1 FROM feed_reactions WHERE feed_id = af.id AND user_id = target_user_id) as user_reacted
  FROM activity_feed af
  JOIN profiles p ON p.id = af.user_id
  WHERE af.privacy = 'public'
     OR af.user_id = target_user_id
     OR (af.privacy = 'friends' AND EXISTS (
       SELECT 1 FROM friendships
       WHERE (user_id = target_user_id AND friend_id = af.user_id AND status = 'accepted')
          OR (friend_id = target_user_id AND user_id = af.user_id AND status = 'accepted')
     ))
  ORDER BY af.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PHASE 3 SETUP COMPLETE
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'notification_preferences',
    'notification_tokens',
    'scheduled_notifications',
    'activity_feed',
    'feed_reactions',
    'feed_comments',
    'shopping_lists',
    'meal_plan_items',
    'recipe_reviews',
    'recipe_favorites',
    'recipe_collections',
    'user_preferences',
    'privacy_settings',
    'meal_recommendations'
  );
  
  RAISE NOTICE 'Phase 3 Setup Complete! Created % tables.', table_count;
  RAISE NOTICE 'All RLS policies have been applied.';
  RAISE NOTICE 'Phase 3 features are ready to use!';
END $$;
