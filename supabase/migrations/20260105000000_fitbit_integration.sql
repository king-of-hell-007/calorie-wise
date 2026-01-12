-- Fitbit Integration Tables

-- Store Fitbit connection tokens
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

-- Store daily Fitbit data
CREATE TABLE IF NOT EXISTS fitbit_daily_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Calories & Activity
  calories_burned INTEGER,  -- Total calories burned (TDEE)
  calories_bmr INTEGER,     -- Basal Metabolic Rate
  calories_active INTEGER,  -- Active calories
  
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

-- RLS Policies for fitbit_connections
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

-- RLS Policies for fitbit_daily_data
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fitbit_connections_user_id ON fitbit_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_fitbit_daily_data_user_date ON fitbit_daily_data(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_fitbit_daily_data_date ON fitbit_daily_data(date DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fitbit_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fitbit_data_timestamp
  BEFORE UPDATE ON fitbit_daily_data
  FOR EACH ROW
  EXECUTE FUNCTION update_fitbit_data_updated_at();

-- Add fitbit_connected flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fitbit_connected BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS use_dynamic_calories BOOLEAN DEFAULT false;

COMMENT ON TABLE fitbit_connections IS 'Stores Fitbit OAuth tokens and connection status';
COMMENT ON TABLE fitbit_daily_data IS 'Stores daily Fitbit activity, heart rate, sleep, and body measurement data';
COMMENT ON COLUMN profiles.fitbit_connected IS 'Whether user has connected their Fitbit account';
COMMENT ON COLUMN profiles.use_dynamic_calories IS 'Whether to use Fitbit data for dynamic calorie calculations';
