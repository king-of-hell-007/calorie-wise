-- Phase 2B Additional Migration
-- Add username field to profiles for friend search

-- Add username column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for fast username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Add comment
COMMENT ON COLUMN profiles.username IS 'Unique username for friend search and social features';

-- Note: Users can set their username in profile settings
-- Username is optional but recommended for social features
