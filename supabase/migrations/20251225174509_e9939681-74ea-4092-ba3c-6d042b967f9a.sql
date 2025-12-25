
-- ============================================
-- MIGRAÇÃO: Consolidar RLS employees (7→5)
-- ============================================

-- 1. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Service role full access employees" ON public.employees;
DROP POLICY IF EXISTS "employees_admin_owner_v18" ON public.employees;
DROP POLICY IF EXISTS "Admins can delete employees" ON public.employees;
DROP POLICY IF EXISTS "Only owner can delete employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view own record or admin views all" ON public.employees;

-- 2. Criar 4 políticas consolidadas + 1 service

-- SELECT: Admin/Owner vê todos, funcionário vê próprio
CREATE POLICY "emp_select_v17" ON public.employees
FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()) OR user_id = auth.uid());

-- INSERT: Somente Admin/Owner (contratar)
CREATE POLICY "emp_insert_v17" ON public.employees
FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

-- UPDATE: Admin/Owner atualiza todos, funcionário próprio registro
CREATE POLICY "emp_update_v17" ON public.employees
FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()) OR user_id = auth.uid())
WITH CHECK (is_admin_or_owner(auth.uid()) OR user_id = auth.uid());

-- DELETE: Somente Owner (demitir - operação crítica)
CREATE POLICY "emp_delete_v17" ON public.employees
FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

-- SERVICE ROLE: Para integrações/automações
CREATE POLICY "emp_service_v17" ON public.employees
FOR ALL TO service_role
USING (true) WITH CHECK (true);
