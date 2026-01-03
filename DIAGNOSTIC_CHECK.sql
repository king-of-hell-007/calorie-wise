-- Diagnostic SQL Script - Run in Supabase Dashboard SQL Editor
-- This will help identify why the Edge Function is failing

-- 1. Check if admin_api_keys table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'admin_api_keys'
) as table_exists;

-- 2. Check if any API keys exist
SELECT 
  COUNT(*) as total_keys,
  COUNT(*) FILTER (WHERE provider = 'gemini') as gemini_keys,
  COUNT(*) FILTER (WHERE provider = 'gemini' AND is_active = true) as active_gemini_keys
FROM admin_api_keys;

-- 3. Show all Gemini API keys (without exposing full key value)
SELECT 
  id,
  key_name,
  provider,
  is_active,
  usage_count,
  error_count,
  LEFT(key_value, 10) || '...' as key_preview,  -- Only show first 10 chars
  created_at,
  last_used_at,
  last_error_at
FROM admin_api_keys
WHERE provider = 'gemini'
ORDER BY is_active DESC, error_count ASC;

-- 4. Check RLS policies on admin_api_keys
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'admin_api_keys';

-- 5. Test if service role can access keys (this should work)
-- Note: This query simulates what the Edge Function does
SELECT 
  COUNT(*) as accessible_keys
FROM admin_api_keys
WHERE provider = 'gemini' AND is_active = true;

-- 6. Check if there are any constraints or issues
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'admin_api_keys'::regclass;
