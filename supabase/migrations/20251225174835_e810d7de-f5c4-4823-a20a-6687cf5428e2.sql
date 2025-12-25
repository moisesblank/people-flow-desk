
-- ============================================
-- MIGRAÇÃO: Consolidar RLS bank_accounts (7→5)
-- ============================================

-- 1. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "bank_accounts_manage" ON public.bank_accounts;
DROP POLICY IF EXISTS "financial_manage_bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "bank_insert_admin" ON public.bank_accounts;
DROP POLICY IF EXISTS "auth_read_bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "bank_accounts_secure" ON public.bank_accounts;
DROP POLICY IF EXISTS "bank_select_admin" ON public.bank_accounts;
DROP POLICY IF EXISTS "bank_update_admin" ON public.bank_accounts;

-- 2. Criar 4 políticas consolidadas + 1 service
-- Lógica: Contas PESSOAIS só o criador vê, EMPRESARIAIS admin/owner vê

-- SELECT: Admin/Owner vê tudo, criador vê própria pessoal
CREATE POLICY "bank_select_v17" ON public.bank_accounts
FOR SELECT TO authenticated
USING (
  is_admin_or_owner(auth.uid()) OR 
  (is_personal = true AND created_by = auth.uid()) OR
  (is_personal = false OR is_personal IS NULL)
);

-- INSERT: Admin/Owner ou usuário criando conta pessoal
CREATE POLICY "bank_insert_v17" ON public.bank_accounts
FOR INSERT TO authenticated
WITH CHECK (
  is_admin_or_owner(auth.uid()) OR 
  (is_personal = true AND created_by = auth.uid())
);

-- UPDATE: Admin/Owner ou criador da própria pessoal
CREATE POLICY "bank_update_v17" ON public.bank_accounts
FOR UPDATE TO authenticated
USING (
  is_admin_or_owner(auth.uid()) OR 
  (is_personal = true AND created_by = auth.uid())
)
WITH CHECK (
  is_admin_or_owner(auth.uid()) OR 
  (is_personal = true AND created_by = auth.uid())
);

-- DELETE: Somente Owner (dados financeiros críticos)
CREATE POLICY "bank_delete_v17" ON public.bank_accounts
FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

-- SERVICE ROLE: Para integrações
CREATE POLICY "bank_service_v17" ON public.bank_accounts
FOR ALL TO service_role
USING (true) WITH CHECK (true);
