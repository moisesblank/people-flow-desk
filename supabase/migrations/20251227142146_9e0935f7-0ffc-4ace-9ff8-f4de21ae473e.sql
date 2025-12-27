-- P0 FIX: alinhar RLS do módulo RH com staff de gestão (is_gestao_staff)
-- Mantém fail-closed: sem role => nega; service_role permanece com acesso total.

-- employees
DROP POLICY IF EXISTS emp_select_v17 ON public.employees;
DROP POLICY IF EXISTS emp_insert_v17 ON public.employees;
DROP POLICY IF EXISTS emp_update_v17 ON public.employees;
DROP POLICY IF EXISTS emp_delete_v17 ON public.employees;

CREATE POLICY emp_select_v18
ON public.employees
FOR SELECT
TO authenticated
USING (
  public.is_gestao_staff(auth.uid())
  OR (user_id = auth.uid())
);

CREATE POLICY emp_insert_v18
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_gestao_staff(auth.uid())
);

CREATE POLICY emp_update_v18
ON public.employees
FOR UPDATE
TO authenticated
USING (
  public.is_gestao_staff(auth.uid())
  OR (user_id = auth.uid())
)
WITH CHECK (
  public.is_gestao_staff(auth.uid())
  OR (user_id = auth.uid())
);

CREATE POLICY emp_delete_v18
ON public.employees
FOR DELETE
TO authenticated
USING (
  public.is_gestao_staff(auth.uid())
);

-- employee_compensation
DROP POLICY IF EXISTS compensation_select_v18 ON public.employee_compensation;
DROP POLICY IF EXISTS compensation_insert_v18 ON public.employee_compensation;
DROP POLICY IF EXISTS compensation_update_v18 ON public.employee_compensation;
DROP POLICY IF EXISTS compensation_delete_v18 ON public.employee_compensation;

CREATE POLICY compensation_select_v19
ON public.employee_compensation
FOR SELECT
TO authenticated
USING (
  public.is_gestao_staff(auth.uid())
);

CREATE POLICY compensation_insert_v19
ON public.employee_compensation
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_gestao_staff(auth.uid())
);

CREATE POLICY compensation_update_v19
ON public.employee_compensation
FOR UPDATE
TO authenticated
USING (
  public.is_gestao_staff(auth.uid())
)
WITH CHECK (
  public.is_gestao_staff(auth.uid())
);

CREATE POLICY compensation_delete_v19
ON public.employee_compensation
FOR DELETE
TO authenticated
USING (
  public.is_gestao_staff(auth.uid())
);
