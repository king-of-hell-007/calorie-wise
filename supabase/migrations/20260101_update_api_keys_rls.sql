-- Migration to allow authenticated users to read API keys for analysis
-- This is needed for the geminiService to fetch API keys

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view api keys" ON public.admin_api_keys;
DROP POLICY IF EXISTS "Admins can manage api keys" ON public.admin_api_keys;

-- Create new policies that allow authenticated users to read active API keys
-- But only admins can manage them
CREATE POLICY "Authenticated users can view active api keys"
  ON public.admin_api_keys FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can insert api keys"
  ON public.admin_api_keys FOR INSERT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update api keys"
  ON public.admin_api_keys FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete api keys"
  ON public.admin_api_keys FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add a comment explaining the security model
COMMENT ON POLICY "Authenticated users can view active api keys" ON public.admin_api_keys IS 
  'Allows authenticated users to read active API keys for nutrition analysis. Keys are rotated automatically and usage is tracked.';
