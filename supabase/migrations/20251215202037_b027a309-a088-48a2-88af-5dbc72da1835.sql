
-- Fix employees table RLS policies
DROP POLICY IF EXISTS "Admin owner manages all employees" ON public.employees;
DROP POLICY IF EXISTS "Employee views only self" ON public.employees;
DROP POLICY IF EXISTS "employees_view_own_or_admin" ON public.employees;

-- Create proper policies for employees (only authenticated users)
CREATE POLICY "Admins can view all employees"
ON public.employees
FOR SELECT
TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Employees can view only themselves"
ON public.employees
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can insert employees"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update employees"
ON public.employees
FOR UPDATE
TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete employees"
ON public.employees
FOR DELETE
TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- Fix affiliates table RLS policies - drop and recreate with proper role
DROP POLICY IF EXISTS "Admins can view affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Admins can insert affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Admins can update affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Admins can delete affiliates" ON public.affiliates;

-- Recreate affiliates policies with stricter access
CREATE POLICY "Admins can view all affiliates"
ON public.affiliates
FOR SELECT
TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Affiliates can view own data"
ON public.affiliates
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can insert affiliates"
ON public.affiliates
FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update affiliates"
ON public.affiliates
FOR UPDATE
TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete affiliates"
ON public.affiliates
FOR DELETE
TO authenticated
USING (is_admin_or_owner(auth.uid()));
