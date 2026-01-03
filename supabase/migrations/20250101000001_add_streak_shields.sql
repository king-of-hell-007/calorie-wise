-- Add streak-related columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS streak_shields INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_streak_check_date DATE;

-- Add comments
COMMENT ON COLUMN public.profiles.streak_shields IS 'Number of shields user has (max 3)';
COMMENT ON COLUMN public.profiles.longest_streak_days IS 'Longest streak ever achieved';
COMMENT ON COLUMN public.profiles.last_streak_check_date IS 'Last date streak was checked';

-- Create streak milestones table
CREATE TABLE IF NOT EXISTS public.streak_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  days_required INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  points_reward INTEGER DEFAULT 0,
  shields_reward INTEGER DEFAULT 0,
  badge_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create streak rewards tracking table
CREATE TABLE IF NOT EXISTS public.streak_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.streak_milestones(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, milestone_id)
);

-- Insert default milestones
INSERT INTO public.streak_milestones (days_required, name, description, points_reward, shields_reward, badge_name) VALUES
  (7, 'Week Warrior', 'Maintained streak for 7 days', 50, 1, 'Streak Master'),
  (30, 'Month Master', 'Maintained streak for 30 days', 200, 2, 'Consistency King'),
  (60, 'Two Month Titan', 'Maintained streak for 60 days', 500, 0, 'Lightning Tracker'),
  (100, 'Century Club', 'Maintained streak for 100 days', 1000, 3, 'Century Club'),
  (180, 'Half Year Hero', 'Maintained streak for 6 months', 2000, 0, 'Half-Year Hero'),
  (365, 'Year Warrior', 'Maintained streak for 1 year', 5000, 0, 'Year Warrior')
ON CONFLICT (days_required) DO NOTHING;

-- Create trigger function for streak updates
CREATE OR REPLACE FUNCTION trigger_update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- Award shields at milestones
  IF NEW.current_streak_days >= 7 AND OLD.current_streak_days < 7 THEN
    NEW.streak_shields := LEAST(NEW.streak_shields + 1, 3);
  END IF;
  
  IF NEW.current_streak_days >= 30 AND OLD.current_streak_days < 30 THEN
    NEW.streak_shields := LEAST(NEW.streak_shields + 2, 3);
  END IF;
  
  IF NEW.current_streak_days >= 100 AND OLD.current_streak_days < 100 THEN
    NEW.streak_shields := 3;
  END IF;
  
  -- Update longest streak
  IF NEW.current_streak_days > NEW.longest_streak_days THEN
    NEW.longest_streak_days := NEW.current_streak_days;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_user_streak_trigger ON public.profiles;
CREATE TRIGGER update_user_streak_trigger
  BEFORE UPDATE OF current_streak_days ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_streak();

-- Enable RLS
ALTER TABLE public.streak_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Milestones are viewable by everyone"
  ON public.streak_milestones FOR SELECT
  USING (true);

CREATE POLICY "Users can view own rewards"
  ON public.streak_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards"
  ON public.streak_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);
