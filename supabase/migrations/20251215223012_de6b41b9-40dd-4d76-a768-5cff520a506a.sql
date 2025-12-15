-- =====================================================
-- SECURITY FIX: Remove conflicting/insecure RLS policies
-- SYNAPSE v14.1 - Security Hardening
-- =====================================================

-- 1. FIX webhook_rate_limits - Remove public access policies
DROP POLICY IF EXISTS "System manages rate_limits" ON public.webhook_rate_limits;
DROP POLICY IF EXISTS "System can manage rate limits" ON public.webhook_rate_limits;

-- Only keep admin policy for viewing, webhooks use service role
-- The webhook uses service role which bypasses RLS anyway

-- 2. FIX profiles - Owner should be able to see all profiles for admin purposes
DROP POLICY IF EXISTS "Owner can view all profiles" ON public.profiles;
CREATE POLICY "Owner can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (is_owner(auth.uid()));

-- 3. FIX sales - Remove duplicate policy 
DROP POLICY IF EXISTS "Owner only delete sales" ON public.sales;
DROP POLICY IF EXISTS "Owner only insert sales" ON public.sales;
DROP POLICY IF EXISTS "Owner only update sales" ON public.sales;
DROP POLICY IF EXISTS "Owner only view sales" ON public.sales;

-- 4. FIX students - Remove duplicate policy
DROP POLICY IF EXISTS "Only admin can manage students" ON public.students;

-- 5. Add cleanup function for old rate limits (security best practice)
CREATE OR REPLACE FUNCTION public.auto_cleanup_rate_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete rate limits older than 1 hour
  DELETE FROM public.webhook_rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
  RETURN NEW;
END;
$$;

-- 6. Add periodic cleanup trigger (runs on each new insert to clean old entries)
DROP TRIGGER IF EXISTS trigger_cleanup_rate_limits ON public.webhook_rate_limits;
CREATE TRIGGER trigger_cleanup_rate_limits
  AFTER INSERT ON public.webhook_rate_limits
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.auto_cleanup_rate_limits();

-- 7. Improve profiles visibility - add admin access
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (is_admin_or_owner(auth.uid()));

-- 8. Add index for faster rate limit cleanup
CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_window_start 
ON public.webhook_rate_limits(window_start);

-- 9. Add index for profiles queries
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_profiles_last_activity 
ON public.profiles(last_activity_at DESC NULLS LAST);