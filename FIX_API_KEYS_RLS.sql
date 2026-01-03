-- Fix RLS policy for admin_api_keys table
-- This allows authenticated users to READ API keys (needed for geminiService.ts)
-- Keys are still protected - only reading, not modifying

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read API keys" ON public.admin_api_keys;
DROP POLICY IF EXISTS "Allow service role full access to API keys" ON public.admin_api_keys;

-- Allow authenticated users to SELECT (read) API keys
-- This is needed for the frontend geminiService.ts to fetch keys
CREATE POLICY "Allow authenticated users to read API keys"
ON public.admin_api_keys
FOR SELECT
TO authenticated
USING (true);

-- Allow service role (backend) full access
CREATE POLICY "Allow service role full access to API keys"
ON public.admin_api_keys
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.admin_api_keys ENABLE ROW LEVEL SECURITY;
