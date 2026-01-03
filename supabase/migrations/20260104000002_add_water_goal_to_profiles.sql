-- Phase 2C Additional Migration
-- Add daily_water_goal_ml field to profiles for water tracking

-- Add daily water goal column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_water_goal_ml INTEGER DEFAULT 2000;

-- Add comment
COMMENT ON COLUMN profiles.daily_water_goal_ml IS 'Daily water intake goal in milliliters (default 2000ml = 2L)';

-- Note: Default is 2L (2000ml) which is a standard recommendation
