-- Add policy for friend search to allow users to view other profiles' basic info
CREATE POLICY "Users can view profiles for friend search"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);