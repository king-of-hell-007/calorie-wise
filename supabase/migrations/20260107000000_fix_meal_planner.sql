-- Meal Planner Fix: Create meal_plan_entries table
-- The existing meal_plans table is used for nutrition targets (Phase 1).
-- This creates a separate table for weekly meal scheduling.
-- Safe to re-run (all statements are idempotent).

-- ============================================================================
-- 1. CREATE meal_plan_entries TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS meal_plan_entries (
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

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_meal_plan_entries_user_date ON meal_plan_entries(user_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_meal_plan_entries_date ON meal_plan_entries(plan_date);

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own meal plan entries" ON meal_plan_entries;
DROP POLICY IF EXISTS "Users can insert own meal plan entries" ON meal_plan_entries;
DROP POLICY IF EXISTS "Users can update own meal plan entries" ON meal_plan_entries;
DROP POLICY IF EXISTS "Users can delete own meal plan entries" ON meal_plan_entries;

CREATE POLICY "Users can view own meal plan entries"
  ON meal_plan_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plan entries"
  ON meal_plan_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plan entries"
  ON meal_plan_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plan entries"
  ON meal_plan_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  tbl_exists BOOLEAN;
  col_count INTEGER;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'meal_plan_entries' AND table_schema = 'public'
  ) INTO tbl_exists;

  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'meal_plan_entries' AND table_schema = 'public';

  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Meal Planner Fix Complete!';
  RAISE NOTICE 'meal_plan_entries exists: %', tbl_exists;
  RAISE NOTICE 'Column count: %', col_count;
  RAISE NOTICE 'RLS policies applied.';
  RAISE NOTICE '==========================================';
END $$;
