-- Add pro access tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pro_access_until TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.profiles.pro_access_until IS 'Date until which user has free pro access (from streak rewards)';

-- Create index
CREATE INDEX IF NOT EXISTS idx_profiles_pro_access 
  ON public.profiles(pro_access_until)
  WHERE pro_access_until IS NOT NULL;
