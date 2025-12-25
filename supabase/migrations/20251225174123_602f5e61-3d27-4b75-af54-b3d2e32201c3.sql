
-- ============================================
-- MIGRAÇÃO: Consolidar RLS alunos (7→4) + service
-- ============================================

-- 1. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Admin can manage alunos" ON public.alunos;
DROP POLICY IF EXISTS "Service role full access alunos" ON public.alunos;
DROP POLICY IF EXISTS "alunos_staff_v18" ON public.alunos;
DROP POLICY IF EXISTS "Only owner can delete alunos" ON public.alunos;
DROP POLICY IF EXISTS "Only admin/owner can insert alunos" ON public.alunos;
DROP POLICY IF EXISTS "Only admin/owner can view alunos" ON public.alunos;
DROP POLICY IF EXISTS "Only admin/owner can update alunos" ON public.alunos;

-- 2. Criar 4 políticas consolidadas + 1 service

-- SELECT: Admin/Owner + Suporte (para atendimento ao aluno)
CREATE POLICY "alunos_select_v17" ON public.alunos
FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()) OR is_suporte(auth.uid()));

-- INSERT: Somente Admin/Owner (criar alunos)
CREATE POLICY "alunos_insert_v17" ON public.alunos
FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

-- UPDATE: Admin/Owner + Suporte (atualizar dados do aluno)
CREATE POLICY "alunos_update_v17" ON public.alunos
FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()) OR is_suporte(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()) OR is_suporte(auth.uid()));

-- DELETE: Somente Owner (operação crítica)
CREATE POLICY "alunos_delete_v17" ON public.alunos
FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

-- SERVICE ROLE: Para webhooks Hotmart
CREATE POLICY "alunos_service_v17" ON public.alunos
FOR ALL TO service_role
USING (true) WITH CHECK (true);
