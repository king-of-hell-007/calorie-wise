-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for sex
CREATE TYPE public.user_sex AS ENUM ('male', 'female', 'prefer_not_to_say');

-- Create enum for baseline activity
CREATE TYPE public.baseline_activity AS ENUM ('sedentary', 'mild', 'moderate', 'heavy', 'very_heavy');

-- Create enum for exercise frequency
CREATE TYPE public.exercise_frequency AS ENUM ('never', 'rarely', 'regularly', 'daily');

-- Create enum for exercise duration
CREATE TYPE public.exercise_duration AS ENUM ('15_30_min', '30_60_min', '60_120_min', '120_plus_min');

-- Create enum for goal type
CREATE TYPE public.goal_type AS ENUM ('lose_weight', 'gain_weight', 'maintain', 'recomposition', 'custom');

-- Create enum for meal slot
CREATE TYPE public.meal_slot AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- Users table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Onboarding data
  age INTEGER,
  sex user_sex,
  height_cm INTEGER,
  weight_kg DECIMAL(5,2),
  baseline_activity baseline_activity,
  exercise_frequency exercise_frequency,
  exercise_duration exercise_duration,
  goal goal_type,
  goal_custom_text TEXT,
  dietary_preferences TEXT,
  
  -- Calculated values
  bmi DECIMAL(5,2),
  bmr INTEGER,
  tdee INTEGER,
  target_calories INTEGER,
  protein_g INTEGER,
  carbs_g INTEGER,
  fat_g INTEGER,
  
  -- Gamification
  total_points INTEGER NOT NULL DEFAULT 0,
  current_streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak_days INTEGER NOT NULL DEFAULT 0,
  last_log_date DATE
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Meal entries table
CREATE TABLE public.meal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meal_slot meal_slot NOT NULL,
  image_url TEXT,
  analyzer_json JSONB NOT NULL,
  total_calories INTEGER NOT NULL,
  total_protein INTEGER NOT NULL,
  total_carbs INTEGER NOT NULL,
  total_fat INTEGER NOT NULL,
  confidence DECIMAL(3,2),
  notes TEXT
);

-- Meal plans table
CREATE TABLE public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  daily_target_calories INTEGER NOT NULL,
  protein_g INTEGER NOT NULL,
  carbs_g INTEGER NOT NULL,
  fat_g INTEGER NOT NULL,
  tolerance_percent INTEGER NOT NULL DEFAULT 7,
  plan_json JSONB NOT NULL
);

-- Badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  rule_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User badges table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Points history table
CREATE TABLE public.points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin API keys table (encrypted)
CREATE TABLE public.admin_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL UNIQUE,
  key_value TEXT NOT NULL, -- Will be encrypted
  provider TEXT NOT NULL DEFAULT 'gemini',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_api_keys ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for meal_entries
CREATE POLICY "Users can view own meal entries"
  ON public.meal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal entries"
  ON public.meal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal entries"
  ON public.meal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal entries"
  ON public.meal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for meal_plans
CREATE POLICY "Users can view own meal plans"
  ON public.meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
  ON public.meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON public.meal_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for badges (public read, admin write)
CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can manage badges"
  ON public.badges FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_badges
CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert user badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policies for points_history
CREATE POLICY "Users can view own points history"
  ON public.points_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert points"
  ON public.points_history FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policies for admin_api_keys
CREATE POLICY "Admins can view api keys"
  ON public.admin_api_keys FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage api keys"
  ON public.admin_api_keys FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default badges
INSERT INTO public.badges (name, description, icon, points, rule_json) VALUES
  ('First Meal', 'Log your first meal', '🎉', 10, '{"type": "meal_count", "count": 1}'),
  ('5-Day Streak', 'Log meals for 5 consecutive days', '🔥', 50, '{"type": "streak", "days": 5}'),
  ('10-Day Streak', 'Log meals for 10 consecutive days', '⚡', 100, '{"type": "streak", "days": 10}'),
  ('30-Day Streak', 'Log meals for 30 consecutive days', '💎', 300, '{"type": "streak", "days": 30}'),
  ('Low Sugar Day', 'Complete a day with low sugar intake', '🍬', 20, '{"type": "daily_flag", "flag": "low_sugar"}'),
  ('High Protein Day', 'Meet protein target for the day', '💪', 20, '{"type": "daily_macro", "macro": "protein"}'),
  ('Consistent Logger', 'Log meals 30 days in 60 days', '📊', 150, '{"type": "consistency", "days": 30, "window": 60}'),
  ('Perfect Week', 'Log all 3 meals for 7 consecutive days', '🌟', 200, '{"type": "perfect_week"}')