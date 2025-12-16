-- =====================================================
-- SECURITY IMPROVEMENTS MIGRATION v2
-- Fixing critical security issues identified in scan
-- =====================================================

-- 1. RESTRICT AUDIT_LOGS INSERT - Only system/service role should insert
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Only service role can insert audit logs" ON public.audit_logs;
CREATE POLICY "Only service role can insert audit logs"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also allow authenticated users to insert their own audit logs for now
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 2. RESTRICT ANALYTICS_METRICS INSERT - Better validation
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics_metrics;
DROP POLICY IF EXISTS "Authenticated users can insert analytics" ON public.analytics_metrics;
DROP POLICY IF EXISTS "Anon can insert basic analytics" ON public.analytics_metrics;

CREATE POLICY "Authenticated users can insert analytics"
ON public.analytics_metrics
FOR INSERT
TO authenticated
WITH CHECK (
  session_id IS NOT NULL AND LENGTH(session_id) >= 10
);

CREATE POLICY "Anon can insert basic analytics"
ON public.analytics_metrics
FOR INSERT
TO anon
WITH CHECK (
  metric_type = 'pageview' AND
  page_path IS NOT NULL
);

-- 3. ADD AUDIT LOGGING FUNCTION for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  p_table_name TEXT,
  p_action TEXT,
  p_record_count INTEGER DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    metadata,
    created_at
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    jsonb_build_object(
      'record_count', p_record_count,
      'accessed_at', NOW(),
      'ip_hint', 'logged'
    ),
    NOW()
  );
END;
$$;

-- 4. DROP AND RECREATE SECURE VIEW FOR PROFILES
DROP VIEW IF EXISTS public.profiles_public CASCADE;
CREATE VIEW public.profiles_public AS
SELECT 
  id,
  nome,
  avatar_url,
  bio,
  level,
  xp_total,
  streak_days,
  is_online,
  created_at,
  CASE 
    WHEN id = auth.uid() OR public.is_owner() THEN email
    ELSE CONCAT(LEFT(COALESCE(email, ''), 2), '***@***', RIGHT(COALESCE(email, ''), 4))
  END as email,
  CASE 
    WHEN id = auth.uid() OR public.is_owner() THEN phone
    ELSE NULL
  END as phone
FROM public.profiles;

-- 5. DROP AND RECREATE SECURE VIEW FOR EMPLOYEES
DROP VIEW IF EXISTS public.employees_safe CASCADE;
CREATE VIEW public.employees_safe AS
SELECT 
  e.id,
  e.nome,
  e.funcao,
  e.setor,
  e.status,
  e.horario_trabalho,
  e.data_admissao,
  e.created_at,
  e.updated_at,
  e.user_id,
  e.responsabilidades,
  e.created_by,
  CASE 
    WHEN e.user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()) THEN e.email
    ELSE CONCAT(LEFT(COALESCE(e.email, ''), 2), '***@***')
  END as email,
  CASE 
    WHEN e.user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()) THEN e.telefone
    ELSE NULL
  END as telefone,
  CASE 
    WHEN public.is_owner(auth.uid()) THEN (SELECT ec.salario FROM public.employee_compensation ec WHERE ec.employee_id = e.id)
    ELSE NULL
  END as salario
FROM public.employees e;

-- 6. ADD DATA RETENTION POLICY - Auto-cleanup old sensitive logs
CREATE OR REPLACE FUNCTION public.cleanup_old_sensitive_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.two_factor_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  DELETE FROM public.activity_log
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM public.analytics_metrics
  WHERE created_at < NOW() - INTERVAL '365 days';
  
  DELETE FROM public.user_sessions
  WHERE logout_at IS NOT NULL 
    AND logout_at < NOW() - INTERVAL '30 days';
END;
$$;

-- 7. IMPROVE TWO_FACTOR_CODES - Shorter expiration
ALTER TABLE public.two_factor_codes 
ALTER COLUMN expires_at SET DEFAULT NOW() + INTERVAL '5 minutes';

-- 8. ADD INDEX for faster sensitive data queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
ON public.audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_created 
ON public.activity_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active 
ON public.user_sessions (user_id, is_active, login_at DESC);

-- 9. ADD SECURITY MONITORING VIEW
DROP VIEW IF EXISTS public.security_dashboard;
CREATE VIEW public.security_dashboard AS
SELECT 
  'failed_logins' as metric,
  COUNT(*)::INTEGER as value
FROM public.activity_log
WHERE action = 'LOGIN_FAILED' 
  AND created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'active_sessions' as metric,
  COUNT(*)::INTEGER as value
FROM public.user_sessions
WHERE is_active = true
UNION ALL
SELECT 
  'recent_2fa_attempts' as metric,
  COUNT(*)::INTEGER as value
FROM public.two_factor_codes
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 10. UPDATE PROFILES RLS - More restrictive
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles with logging" ON public.profiles;
CREATE POLICY "Admins can view all profiles with logging"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid() OR 
  public.is_owner()
);

-- 11. ADD RATE LIMITING FOR SENSITIVE OPERATIONS
CREATE TABLE IF NOT EXISTS public.sensitive_operation_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, operation_type, window_start)
);

ALTER TABLE public.sensitive_operation_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only see own rate limits" ON public.sensitive_operation_limits;
CREATE POLICY "Users can only see own rate limits"
ON public.sensitive_operation_limits
FOR ALL
USING (user_id = auth.uid());

-- Function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_operation TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.sensitive_operation_limits
  WHERE window_start < NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  SELECT COALESCE(SUM(request_count), 0) INTO v_count
  FROM public.sensitive_operation_limits
  WHERE user_id = auth.uid()
    AND operation_type = p_operation
    AND window_start > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  IF v_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO public.sensitive_operation_limits (user_id, operation_type)
  VALUES (auth.uid(), p_operation)
  ON CONFLICT (user_id, operation_type, window_start) 
  DO UPDATE SET request_count = sensitive_operation_limits.request_count + 1;
  
  RETURN TRUE;
END;
$$;