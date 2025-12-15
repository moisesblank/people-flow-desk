-- ═══════════════════════════════════════════════════════════════
-- SECURITY FIX: Restricting RLS policies for sensitive data
-- ═══════════════════════════════════════════════════════════════

-- Drop existing permissive policies on profiles
DROP POLICY IF EXISTS "profiles_viewable_by_all" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create more restrictive profile policies
-- Users can only view their OWN profile, OR owner/admin can view all
CREATE POLICY "users_view_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() 
    OR public.is_admin_or_owner(auth.uid())
  );

-- Drop existing permissive policies on employees
DROP POLICY IF EXISTS "employees_viewable_by_admin" ON public.employees;
DROP POLICY IF EXISTS "Employees can view their own record" ON public.employees;

-- Create restrictive employee policies - only owner/admin can see salary
CREATE POLICY "employees_view_own_or_admin" ON public.employees
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin_or_owner(auth.uid())
  );

-- Drop existing permissive policies on affiliates  
DROP POLICY IF EXISTS "affiliates_viewable_by_admin" ON public.affiliates;

-- Affiliates - only owner can see commission data
CREATE POLICY "affiliates_owner_only" ON public.affiliates
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin_or_owner(auth.uid())
  );

CREATE POLICY "affiliates_owner_manage" ON public.affiliates
  FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()))
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- Create secure view for employees (without salary for non-admins)
CREATE OR REPLACE VIEW public.employees_public AS
SELECT 
  id,
  nome,
  funcao,
  setor,
  email,
  status,
  created_at
FROM public.employees;

-- Grant access to the view
GRANT SELECT ON public.employees_public TO authenticated;