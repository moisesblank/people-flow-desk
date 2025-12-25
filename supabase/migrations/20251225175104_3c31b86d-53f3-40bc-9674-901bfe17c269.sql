
-- ============================================
-- MIGRAÇÃO: Consolidar RLS sna_jobs (12→5)
-- ============================================

-- 1. Remover TODAS as 12 políticas existentes
DROP POLICY IF EXISTS "sna_jobs_owner" ON public.sna_jobs;
DROP POLICY IF EXISTS "sna_jobs_owner_admin" ON public.sna_jobs;
DROP POLICY IF EXISTS "sna_jobs_owner_all" ON public.sna_jobs;
DROP POLICY IF EXISTS "sna_delete" ON public.sna_jobs;
DROP POLICY IF EXISTS "sna_insert" ON public.sna_jobs;
DROP POLICY IF EXISTS "sna_jobs_insert" ON public.sna_jobs;
DROP POLICY IF EXISTS "sna_jobs_system_insert" ON public.sna_jobs;
DROP POLICY IF EXISTS "sna_jobs_select" ON public.sna_jobs;
DROP POLICY IF EXISTS "sna_jobs_user_read" ON public.sna_jobs;
DROP POLICY IF EXISTS "sna_select" ON public.sna_jobs;
DROP POLICY IF EXISTS "sna_jobs_update" ON public.sna_jobs;
DROP POLICY IF EXISTS "sna_update" ON public.sna_jobs;

-- 2. Criar 4 políticas consolidadas + 1 service
-- Lógica: Usuário interage com IA, vê próprios jobs

-- SELECT: Admin/Owner vê tudo, usuário vê próprios jobs
CREATE POLICY "sna_jobs_select_v17" ON public.sna_jobs
FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()) OR created_by = auth.uid());

-- INSERT: Qualquer usuário logado pode criar job de IA
CREATE POLICY "sna_jobs_insert_v17" ON public.sna_jobs
FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() OR is_admin_or_owner(auth.uid()));

-- UPDATE: Admin/Owner ou criador do job
CREATE POLICY "sna_jobs_update_v17" ON public.sna_jobs
FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()) OR created_by = auth.uid())
WITH CHECK (is_admin_or_owner(auth.uid()) OR created_by = auth.uid());

-- DELETE: Somente Owner (jobs são histórico importante)
CREATE POLICY "sna_jobs_delete_v17" ON public.sna_jobs
FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

-- SERVICE ROLE: Para workers de IA processarem jobs
CREATE POLICY "sna_jobs_service_v17" ON public.sna_jobs
FOR ALL TO service_role
USING (true) WITH CHECK (true);
