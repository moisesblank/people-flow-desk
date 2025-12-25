-- =====================================================
-- SECURITY HARDENING v17.1 - CONSOLIDAÇÃO PARTE 2
-- Data: 25/12/2025
-- Objetivo: Corrigir policies duplicadas e vulneráveis
-- OWNER: moisesblank@gmail.com
-- =====================================================

-- =====================================================
-- CORRIGIR: gastos (policy com WITH CHECK true)
-- =====================================================

DROP POLICY IF EXISTS "Service can insert gastos" ON public.gastos;

-- Criar policy segura para service role
CREATE POLICY "gastos_service_insert" ON public.gastos
FOR INSERT TO public
WITH CHECK (auth.role() = 'service_role'::text);

-- =====================================================
-- CORRIGIR: whatsapp_leads (policies com WITH CHECK true)
-- =====================================================

DROP POLICY IF EXISTS "Service role pode inserir leads" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "wa_leads_insert_service" ON public.whatsapp_leads;

-- Criar policy segura para service role
CREATE POLICY "whatsapp_leads_service_insert" ON public.whatsapp_leads
FOR INSERT TO public
WITH CHECK (auth.role() = 'service_role'::text);

-- Remover policies duplicadas de whatsapp_leads
DROP POLICY IF EXISTS "Admin can manage whatsapp leads" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "Only staff can manage whatsapp_leads" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "Only staff can view whatsapp_leads" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "WhatsApp leads editable by admins" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "WhatsApp leads viewable by admins" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "leads_admin_manage_v4" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "v16_whatsapp_leads_delete" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "v16_whatsapp_leads_insert" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "v16_whatsapp_leads_select" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "v16_whatsapp_leads_update" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "wa_leads_select_admin" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "wa_leads_update_admin" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "whatsapp_leads_all" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "whatsapp_leads_insert_secure" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "whatsapp_leads_manage" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "whatsapp_leads_secure" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "whatsapp_leads_select" ON public.whatsapp_leads;

-- Manter apenas:
-- whatsapp_leads_delete_owner
-- whatsapp_leads_service_insert (nova)

-- Criar policies consolidadas para whatsapp_leads
CREATE POLICY "whatsapp_leads_select_v17" ON public.whatsapp_leads
FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()) OR has_role(auth.uid(), 'suporte'::text) OR has_role(auth.uid(), 'marketing'::text));

CREATE POLICY "whatsapp_leads_insert_v17" ON public.whatsapp_leads
FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()) OR has_role(auth.uid(), 'suporte'::text) OR has_role(auth.uid(), 'marketing'::text));

CREATE POLICY "whatsapp_leads_update_v17" ON public.whatsapp_leads
FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()) OR has_role(auth.uid(), 'suporte'::text))
WITH CHECK (is_admin_or_owner(auth.uid()) OR has_role(auth.uid(), 'suporte'::text));

-- =====================================================
-- CONSOLIDAR: time_clock_entries (muitas duplicatas)
-- =====================================================

-- Remover todas as policies duplicadas
DROP POLICY IF EXISTS "Admin can manage time clock entries" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Admin can update time entries" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Admin gerencia pontos" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Employee inserts own time_clock_entries" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Employee views own time_clock_entries" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Employees can insert own time entries" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Employees can view own time entries" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Employees view own time entries" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Funcionário registra próprio ponto" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Funcionário vê próprios pontos" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Owner and admin view all time entries" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Owner can delete time entries" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Time clock editable by user or admin" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Time clock viewable by user or admin" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Time entries admin manage all" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Time entries employee insert own" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Time entries employee self only" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Time entries employee update own" ON public.time_clock_entries;
DROP POLICY IF EXISTS "time_clock_insert_own" ON public.time_clock_entries;
DROP POLICY IF EXISTS "time_clock_select" ON public.time_clock_entries;
DROP POLICY IF EXISTS "time_clock_select_secure" ON public.time_clock_entries;
DROP POLICY IF EXISTS "time_clock_update_admin" ON public.time_clock_entries;
DROP POLICY IF EXISTS "timeclock_insert_policy" ON public.time_clock_entries;
DROP POLICY IF EXISTS "timeclock_select_policy" ON public.time_clock_entries;
DROP POLICY IF EXISTS "timeclock_update_admin" ON public.time_clock_entries;

-- Criar 4 policies limpas para time_clock_entries
CREATE POLICY "time_clock_select_v17" ON public.time_clock_entries
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  OR is_admin_or_owner(auth.uid())
);

CREATE POLICY "time_clock_insert_v17" ON public.time_clock_entries
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  OR employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  OR is_admin_or_owner(auth.uid())
);

CREATE POLICY "time_clock_update_v17" ON public.time_clock_entries
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() 
  OR is_admin_or_owner(auth.uid())
)
WITH CHECK (
  user_id = auth.uid() 
  OR is_admin_or_owner(auth.uid())
);

CREATE POLICY "time_clock_delete_v17" ON public.time_clock_entries
FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

-- =====================================================
-- CONSOLIDAR: usuarios_wordpress_sync (duplicatas)
-- =====================================================

DROP POLICY IF EXISTS "Only owner can manage usuarios_wordpress_sync" ON public.usuarios_wordpress_sync;
DROP POLICY IF EXISTS "Only owner can view usuarios_wordpress_sync" ON public.usuarios_wordpress_sync;
DROP POLICY IF EXISTS "Owner/Admin full access usuarios_wp_sync" ON public.usuarios_wordpress_sync;
DROP POLICY IF EXISTS "wordpress_sync_all_admin" ON public.usuarios_wordpress_sync;
DROP POLICY IF EXISTS "wordpress_sync_select_admin" ON public.usuarios_wordpress_sync;
DROP POLICY IF EXISTS "wp_users_delete_owner" ON public.usuarios_wordpress_sync;
DROP POLICY IF EXISTS "wp_users_insert_admin" ON public.usuarios_wordpress_sync;
DROP POLICY IF EXISTS "wp_users_insert_owner" ON public.usuarios_wordpress_sync;
DROP POLICY IF EXISTS "wp_users_select_admin" ON public.usuarios_wordpress_sync;
DROP POLICY IF EXISTS "wp_users_select_owner" ON public.usuarios_wordpress_sync;
DROP POLICY IF EXISTS "wp_users_update_admin" ON public.usuarios_wordpress_sync;
DROP POLICY IF EXISTS "wp_users_update_owner" ON public.usuarios_wordpress_sync;

-- Criar 4 policies limpas para usuarios_wordpress_sync
CREATE POLICY "wp_sync_select_v17" ON public.usuarios_wordpress_sync
FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "wp_sync_insert_v17" ON public.usuarios_wordpress_sync
FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "wp_sync_update_v17" ON public.usuarios_wordpress_sync
FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "wp_sync_delete_v17" ON public.usuarios_wordpress_sync
FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

-- =====================================================
-- CONSOLIDAR: transacoes_hotmart_completo (duplicatas)
-- =====================================================

DROP POLICY IF EXISTS "Only admin/owner can manage transacoes_hotmart" ON public.transacoes_hotmart_completo;
DROP POLICY IF EXISTS "Only admin/owner can view transacoes_hotmart" ON public.transacoes_hotmart_completo;
DROP POLICY IF EXISTS "hotmart_delete_owner_only" ON public.transacoes_hotmart_completo;
DROP POLICY IF EXISTS "hotmart_insert_owner_only" ON public.transacoes_hotmart_completo;
DROP POLICY IF EXISTS "hotmart_select_admin_owner" ON public.transacoes_hotmart_completo;
DROP POLICY IF EXISTS "hotmart_update_owner_only" ON public.transacoes_hotmart_completo;
DROP POLICY IF EXISTS "transacoes_delete_owner" ON public.transacoes_hotmart_completo;
DROP POLICY IF EXISTS "transacoes_insert_system" ON public.transacoes_hotmart_completo;
DROP POLICY IF EXISTS "transacoes_select_owner_admin" ON public.transacoes_hotmart_completo;
DROP POLICY IF EXISTS "transacoes_update_admin" ON public.transacoes_hotmart_completo;

-- Manter apenas Service role full access hotmart

-- Criar 4 policies limpas para transacoes_hotmart_completo
CREATE POLICY "hotmart_select_v17" ON public.transacoes_hotmart_completo
FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "hotmart_insert_v17" ON public.transacoes_hotmart_completo
FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "hotmart_update_v17" ON public.transacoes_hotmart_completo
FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "hotmart_delete_v17" ON public.transacoes_hotmart_completo
FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

-- =====================================================
-- CONSOLIDAR: pagamentos_cursos (simplificar)
-- =====================================================

DROP POLICY IF EXISTS "Admin gerencia pagamentos_cursos" ON public.pagamentos_cursos;
DROP POLICY IF EXISTS "Only admin/owner can manage pagamentos_cursos" ON public.pagamentos_cursos;
DROP POLICY IF EXISTS "Only financial staff can view pagamentos_cursos" ON public.pagamentos_cursos;
DROP POLICY IF EXISTS "Usuário vê próprios pagamentos_cursos" ON public.pagamentos_cursos;

-- Criar policies consolidadas
CREATE POLICY "pagamentos_cursos_select_v17" ON public.pagamentos_cursos
FOR SELECT TO authenticated
USING (
  is_admin_or_owner(auth.uid()) 
  OR has_role(auth.uid(), 'contabilidade'::text)
  OR EXISTS (
    SELECT 1 FROM alunos 
    WHERE alunos.id = pagamentos_cursos.aluno_id 
    AND alunos.email = (auth.jwt() ->> 'email'::text)
  )
);

CREATE POLICY "pagamentos_cursos_insert_v17" ON public.pagamentos_cursos
FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "pagamentos_cursos_update_v17" ON public.pagamentos_cursos
FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "pagamentos_cursos_delete_v17" ON public.pagamentos_cursos
FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

-- =====================================================
-- REGISTRO DE HARDENING PARTE 2
-- =====================================================

INSERT INTO public.audit_logs (action, table_name, metadata, created_at)
VALUES (
  'SECURITY_HARDENING_v17.1',
  'system',
  jsonb_build_object(
    'version', '17.1',
    'date', '2025-12-25',
    'changes', jsonb_build_array(
      'Fixed gastos WITH CHECK true policy',
      'Fixed whatsapp_leads WITH CHECK true policies (2)',
      'Consolidated whatsapp_leads policies (18 -> 4)',
      'Consolidated time_clock_entries policies (24 -> 4)',
      'Consolidated usuarios_wordpress_sync policies (12 -> 4)',
      'Consolidated transacoes_hotmart_completo policies (11 -> 5)',
      'Consolidated pagamentos_cursos policies (4 -> 4)'
    ),
    'owner', 'moisesblank@gmail.com'
  ),
  now()
);