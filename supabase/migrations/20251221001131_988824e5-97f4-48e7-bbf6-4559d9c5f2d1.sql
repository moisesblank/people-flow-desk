-- ================================================================
-- MEGA SECURITY UPGRADE v1.3 - Tabelas Financeiras + Entradas
-- ================================================================

-- ==============================================
-- 23. ENTRADAS - Financeiro + Owner
-- ==============================================
DROP POLICY IF EXISTS "entradas_select_finance" ON public.entradas;
DROP POLICY IF EXISTS "entradas_insert_finance" ON public.entradas;
DROP POLICY IF EXISTS "entradas_update_finance" ON public.entradas;
DROP POLICY IF EXISTS "entradas_delete_owner" ON public.entradas;

CREATE POLICY "entradas_select_finance" ON public.entradas
FOR SELECT TO authenticated
USING (public.can_view_financial(auth.uid()));

CREATE POLICY "entradas_insert_finance" ON public.entradas
FOR INSERT TO authenticated
WITH CHECK (public.can_view_financial(auth.uid()));

CREATE POLICY "entradas_update_finance" ON public.entradas
FOR UPDATE TO authenticated
USING (public.can_view_financial(auth.uid()))
WITH CHECK (public.can_view_financial(auth.uid()));

CREATE POLICY "entradas_delete_owner" ON public.entradas
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));

-- ==============================================
-- 24. COMISSOES - Afiliado vê própria, Admin vê todas
-- ==============================================
DROP POLICY IF EXISTS "comissoes_select_secure" ON public.comissoes;
DROP POLICY IF EXISTS "comissoes_insert_admin" ON public.comissoes;
DROP POLICY IF EXISTS "comissoes_update_admin" ON public.comissoes;
DROP POLICY IF EXISTS "comissoes_delete_owner" ON public.comissoes;

CREATE POLICY "comissoes_select_secure" ON public.comissoes
FOR SELECT TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
  OR afiliado_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid() OR email = public.current_user_email()
  )
);

CREATE POLICY "comissoes_insert_admin" ON public.comissoes
FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "comissoes_update_admin" ON public.comissoes
FOR UPDATE TO authenticated
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "comissoes_delete_owner" ON public.comissoes
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));

-- ==============================================
-- 25. EMPLOYEE_COMPENSATION - Apenas Owner (ultra sensível)
-- ==============================================
DROP POLICY IF EXISTS "emp_comp_select_owner" ON public.employee_compensation;
DROP POLICY IF EXISTS "emp_comp_insert_owner" ON public.employee_compensation;
DROP POLICY IF EXISTS "emp_comp_update_owner" ON public.employee_compensation;
DROP POLICY IF EXISTS "emp_comp_delete_owner" ON public.employee_compensation;

CREATE POLICY "emp_comp_select_owner" ON public.employee_compensation
FOR SELECT TO authenticated
USING (public.is_owner(auth.uid()));

CREATE POLICY "emp_comp_insert_owner" ON public.employee_compensation
FOR INSERT TO authenticated
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "emp_comp_update_owner" ON public.employee_compensation
FOR UPDATE TO authenticated
USING (public.is_owner(auth.uid()))
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "emp_comp_delete_owner" ON public.employee_compensation
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));

-- ==============================================
-- 26. COMPANY FIXED/EXTRA EXPENSES - Financeiro + Owner
-- ==============================================
DROP POLICY IF EXISTS "company_fixed_select_finance" ON public.company_fixed_expenses;
DROP POLICY IF EXISTS "company_fixed_insert_finance" ON public.company_fixed_expenses;
DROP POLICY IF EXISTS "company_fixed_update_finance" ON public.company_fixed_expenses;
DROP POLICY IF EXISTS "company_fixed_delete_owner" ON public.company_fixed_expenses;

CREATE POLICY "company_fixed_select_finance" ON public.company_fixed_expenses
FOR SELECT TO authenticated
USING (public.can_view_financial(auth.uid()));

CREATE POLICY "company_fixed_insert_finance" ON public.company_fixed_expenses
FOR INSERT TO authenticated
WITH CHECK (public.can_view_financial(auth.uid()));

CREATE POLICY "company_fixed_update_finance" ON public.company_fixed_expenses
FOR UPDATE TO authenticated
USING (public.can_view_financial(auth.uid()))
WITH CHECK (public.can_view_financial(auth.uid()));

CREATE POLICY "company_fixed_delete_owner" ON public.company_fixed_expenses
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));

DROP POLICY IF EXISTS "company_extra_select_finance" ON public.company_extra_expenses;
DROP POLICY IF EXISTS "company_extra_insert_finance" ON public.company_extra_expenses;
DROP POLICY IF EXISTS "company_extra_update_finance" ON public.company_extra_expenses;
DROP POLICY IF EXISTS "company_extra_delete_owner" ON public.company_extra_expenses;

CREATE POLICY "company_extra_select_finance" ON public.company_extra_expenses
FOR SELECT TO authenticated
USING (public.can_view_financial(auth.uid()));

CREATE POLICY "company_extra_insert_finance" ON public.company_extra_expenses
FOR INSERT TO authenticated
WITH CHECK (public.can_view_financial(auth.uid()));

CREATE POLICY "company_extra_update_finance" ON public.company_extra_expenses
FOR UPDATE TO authenticated
USING (public.can_view_financial(auth.uid()))
WITH CHECK (public.can_view_financial(auth.uid()));

CREATE POLICY "company_extra_delete_owner" ON public.company_extra_expenses
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));

-- ==============================================
-- 27. USER_ROLES - Apenas Owner pode gerenciar
-- ==============================================
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_owner" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_owner" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_owner" ON public.user_roles;

CREATE POLICY "user_roles_select_own" ON public.user_roles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_owner(auth.uid())
);

CREATE POLICY "user_roles_insert_owner" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "user_roles_update_owner" ON public.user_roles
FOR UPDATE TO authenticated
USING (public.is_owner(auth.uid()))
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "user_roles_delete_owner" ON public.user_roles
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));

-- ==============================================
-- 28. DEAD_LETTER_QUEUE - Apenas Owner
-- ==============================================
DROP POLICY IF EXISTS "dlq_select_owner" ON public.dead_letter_queue;
DROP POLICY IF EXISTS "dlq_update_owner" ON public.dead_letter_queue;
DROP POLICY IF EXISTS "dlq_delete_owner" ON public.dead_letter_queue;

CREATE POLICY "dlq_select_owner" ON public.dead_letter_queue
FOR SELECT TO authenticated
USING (public.is_owner(auth.uid()));

CREATE POLICY "dlq_update_owner" ON public.dead_letter_queue
FOR UPDATE TO authenticated
USING (public.is_owner(auth.uid()))
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "dlq_delete_owner" ON public.dead_letter_queue
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));

-- ==============================================
-- 29. ALERTAS_SISTEMA - Owner + Admin
-- ==============================================
DROP POLICY IF EXISTS "alertas_select_admin" ON public.alertas_sistema;
DROP POLICY IF EXISTS "alertas_insert_system" ON public.alertas_sistema;
DROP POLICY IF EXISTS "alertas_update_admin" ON public.alertas_sistema;

CREATE POLICY "alertas_select_admin" ON public.alertas_sistema
FOR SELECT TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "alertas_insert_system" ON public.alertas_sistema
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "alertas_update_admin" ON public.alertas_sistema
FOR UPDATE TO authenticated
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- ==============================================
-- 30. CONTAS_RECEBER - Financeiro + Owner
-- ==============================================
DROP POLICY IF EXISTS "contas_receber_select_finance" ON public.contas_receber;
DROP POLICY IF EXISTS "contas_receber_insert_finance" ON public.contas_receber;
DROP POLICY IF EXISTS "contas_receber_update_finance" ON public.contas_receber;
DROP POLICY IF EXISTS "contas_receber_delete_owner" ON public.contas_receber;

CREATE POLICY "contas_receber_select_finance" ON public.contas_receber
FOR SELECT TO authenticated
USING (public.can_view_financial(auth.uid()));

CREATE POLICY "contas_receber_insert_finance" ON public.contas_receber
FOR INSERT TO authenticated
WITH CHECK (public.can_view_financial(auth.uid()));

CREATE POLICY "contas_receber_update_finance" ON public.contas_receber
FOR UPDATE TO authenticated
USING (public.can_view_financial(auth.uid()))
WITH CHECK (public.can_view_financial(auth.uid()));

CREATE POLICY "contas_receber_delete_owner" ON public.contas_receber
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));