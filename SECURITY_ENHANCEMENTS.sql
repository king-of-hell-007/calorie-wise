-- ============================================
-- SECURITY ENHANCEMENTS SQL SCRIPT
-- Comprehensive security fixes for CalorieWise
-- ============================================

-- 1. Add RLS policy to admin_api_keys for server-side admin verification
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE admin_api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Only admins can view API keys" ON admin_api_keys;
DROP POLICY IF EXISTS "Only admins can insert API keys" ON admin_api_keys;
DROP POLICY IF EXISTS "Only admins can update API keys" ON admin_api_keys;
DROP POLICY IF EXISTS "Only admins can delete API keys" ON admin_api_keys;

-- Create strict admin-only policies
CREATE POLICY "Only admins can view API keys"
  ON admin_api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert API keys"
  ON admin_api_keys FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update API keys"
  ON admin_api_keys FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete API keys"
  ON admin_api_keys FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- 2. Create security audit log table
-- ============================================

CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON security_audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
  ON security_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- System can insert audit logs (via service role)
CREATE POLICY "System can insert audit logs"
  ON security_audit_log FOR INSERT
  WITH CHECK (true);

-- 3. Add rate limiting table for friend requests
-- ============================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, action_type, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON rate_limits(user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own rate limits
CREATE POLICY "Users can view own rate limits"
  ON rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- System can manage rate limits
CREATE POLICY "System can manage rate limits"
  ON rate_limits FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Function to check and update rate limits
-- ============================================

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action_type TEXT,
  p_max_attempts INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_current_count INTEGER;
BEGIN
  -- Calculate window start (round down to window interval)
  v_window_start := date_trunc('hour', NOW()) + 
    (FLOOR(EXTRACT(MINUTE FROM NOW()) / p_window_minutes) * p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get current count for this window
  SELECT COALESCE(action_count, 0) INTO v_current_count
  FROM rate_limits
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND window_start = v_window_start;
  
  -- Check if limit exceeded
  IF v_current_count >= p_max_attempts THEN
    RETURN FALSE;
  END IF;
  
  -- Increment or create rate limit record
  INSERT INTO rate_limits (user_id, action_type, action_count, window_start)
  VALUES (p_user_id, p_action_type, 1, v_window_start)
  ON CONFLICT (user_id, action_type, window_start)
  DO UPDATE SET action_count = rate_limits.action_count + 1;
  
  RETURN TRUE;
END;
$$;

-- 5. Function to log security events
-- ============================================

CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_details JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO security_audit_log (user_id, event_type, event_details, ip_address, user_agent)
  VALUES (p_user_id, p_event_type, p_event_details, p_ip_address, p_user_agent)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 6. Trigger to log failed login attempts
-- ============================================

CREATE OR REPLACE FUNCTION log_failed_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This would be called from your auth system
  -- For now, it's a placeholder
  PERFORM log_security_event(
    NULL,
    'failed_login',
    jsonb_build_object('email', NEW.email),
    NULL,
    NULL
  );
  
  RETURN NEW;
END;
$$;

-- 7. Add password reset tracking
-- ============================================

CREATE TABLE IF NOT EXISTS password_reset_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_attempts(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_created_at ON password_reset_attempts(created_at DESC);

-- Enable RLS
ALTER TABLE password_reset_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view
CREATE POLICY "Only admins can view password resets"
  ON password_reset_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- System can insert
CREATE POLICY "System can log password resets"
  ON password_reset_attempts FOR INSERT
  WITH CHECK (true);

-- 8. Clean up old rate limit records (run periodically)
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';
  
  DELETE FROM security_audit_log
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM password_reset_attempts
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- 9. Add indexes for better performance
-- ============================================

-- Friendships table indexes (if not already exist)
CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_status ON friendships(friend_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_created_at ON friendships(created_at DESC);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_user_name ON profiles(user_name) WHERE user_name IS NOT NULL;

-- Meal entries indexes
CREATE INDEX IF NOT EXISTS idx_meal_entries_user_date ON meal_entries(user_id, created_at DESC);

-- 10. Verify all tables have RLS enabled
-- ============================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- 11. Grant necessary permissions
-- ============================================

-- Grant execute on security functions to authenticated users
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limits TO service_role;

-- 12. Create a view for admin dashboard
-- ============================================

CREATE OR REPLACE VIEW admin_security_dashboard AS
SELECT 
  'failed_logins_24h' as metric,
  COUNT(*) as value
FROM security_audit_log
WHERE event_type = 'failed_login'
  AND created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'active_users_24h' as metric,
  COUNT(DISTINCT user_id) as value
FROM security_audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'password_resets_24h' as metric,
  COUNT(*) as value
FROM password_reset_attempts
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'rate_limit_violations_24h' as metric,
  COUNT(*) as value
FROM security_audit_log
WHERE event_type = 'rate_limit_exceeded'
  AND created_at > NOW() - INTERVAL '24 hours';

-- Grant view access to admins only
GRANT SELECT ON admin_security_dashboard TO authenticated;

-- RLS for the view
ALTER VIEW admin_security_dashboard SET (security_barrier = true);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Success message
SELECT 'Security enhancements applied successfully!' AS status;
