-- Phase 3: Activity Feed Tables - Patch Migration
-- The activity_feed, feed_reactions, and feed_comments tables already exist
-- (created by PHASE_3_COMPLETE_SETUP.sql or FIX_PHASE_3_COMPLETE.sql)
-- This migration only adds missing columns and ensures RLS policies are set up.
-- Safe to re-run (all statements are idempotent).

-- ============================================================================
-- 1. PATCH activity_feed — add any missing columns
-- ============================================================================

-- The existing table has: id, user_id, activity_type, content, privacy, created_at
-- Add image_url if missing (some earlier migrations may not have it)
ALTER TABLE activity_feed ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ============================================================================
-- 2. PATCH feed_reactions — ensure table exists with correct structure
-- ============================================================================

-- Table already exists: id, feed_id, user_id, reaction_type, created_at
-- Nothing to patch

-- ============================================================================
-- 3. PATCH feed_comments — add missing columns if needed
-- ============================================================================

-- Table already exists: id, feed_id, user_id, comment_text, created_at
-- Nothing to patch

-- ============================================================================
-- 4. ENSURE INDEXES EXIST
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_privacy ON activity_feed(privacy);

CREATE INDEX IF NOT EXISTS idx_feed_reactions_feed_id ON feed_reactions(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_feed ON feed_reactions(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_user_id ON feed_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_user ON feed_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_feed_comments_feed_id ON feed_comments(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_feed ON feed_comments(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_user_id ON feed_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_user ON feed_comments(user_id);

-- ============================================================================
-- 5. ROW LEVEL SECURITY — idempotent (drop + recreate)
-- ============================================================================

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

-- Drop ALL known policy names from any earlier migration
DROP POLICY IF EXISTS "Users can view public and own activities" ON activity_feed;
DROP POLICY IF EXISTS "Users can insert own activities" ON activity_feed;
DROP POLICY IF EXISTS "Users can delete own activities" ON activity_feed;
DROP POLICY IF EXISTS "Users can view public and friends' activity" ON activity_feed;
DROP POLICY IF EXISTS "Users can view activity" ON activity_feed;
DROP POLICY IF EXISTS "Users can create own activity" ON activity_feed;
DROP POLICY IF EXISTS "Users can insert own activity" ON activity_feed;
DROP POLICY IF EXISTS "Users can update own activity" ON activity_feed;
DROP POLICY IF EXISTS "Users can delete own activity" ON activity_feed;

DROP POLICY IF EXISTS "Users can view reactions" ON feed_reactions;
DROP POLICY IF EXISTS "Users can view all reactions" ON feed_reactions;
DROP POLICY IF EXISTS "Users can insert own reactions" ON feed_reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON feed_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON feed_reactions;

DROP POLICY IF EXISTS "Users can view comments" ON feed_comments;
DROP POLICY IF EXISTS "Users can view all comments" ON feed_comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON feed_comments;
DROP POLICY IF EXISTS "Users can add comments" ON feed_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON feed_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON feed_comments;

-- Activity Feed policies (uses existing 'privacy' column, NOT is_public)
CREATE POLICY "Users can view public and own activities"
ON activity_feed FOR SELECT
USING (privacy = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
ON activity_feed FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
ON activity_feed FOR DELETE
USING (auth.uid() = user_id);

-- Feed Reactions policies
CREATE POLICY "Users can view reactions"
ON feed_reactions FOR SELECT
USING (true);

CREATE POLICY "Users can insert own reactions"
ON feed_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
ON feed_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Feed Comments policies
CREATE POLICY "Users can view comments"
ON feed_comments FOR SELECT
USING (true);

CREATE POLICY "Users can insert own comments"
ON feed_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON feed_comments FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 6. TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE activity_feed IS 'Social activity feed for user actions';
COMMENT ON TABLE feed_reactions IS 'Reactions (likes) on activity feed items';
COMMENT ON TABLE feed_comments IS 'Comments on activity feed items';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  af_exists BOOLEAN;
  fr_exists BOOLEAN;
  fc_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_feed') INTO af_exists;
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'feed_reactions') INTO fr_exists;
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'feed_comments') INTO fc_exists;

  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Activity Feed Migration Complete!';
  RAISE NOTICE 'activity_feed: %', af_exists;
  RAISE NOTICE 'feed_reactions: %', fr_exists;
  RAISE NOTICE 'feed_comments: %', fc_exists;
  RAISE NOTICE 'RLS policies have been applied.';
  RAISE NOTICE '==========================================';
END $$;
