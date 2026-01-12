-- ============================================
-- DIAGNOSTIC: Check if email column exists and is populated
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check if email column exists in profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'email';

-- 2. Check what data is in profiles (especially email column)
SELECT id, email, username, full_name 
FROM profiles 
LIMIT 10;

-- 3. Check auth.users emails (for reference)
SELECT id, email 
FROM auth.users 
LIMIT 10;

-- 4. Check if friendships table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'friendships';

-- 5. Check friendships data
SELECT * FROM friendships LIMIT 10;

-- ============================================
-- IF email column is NULL or doesn't exist, run this:
-- ============================================

-- Add email column if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Sync emails from auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Verify sync worked
SELECT id, email, full_name FROM profiles LIMIT 10;
