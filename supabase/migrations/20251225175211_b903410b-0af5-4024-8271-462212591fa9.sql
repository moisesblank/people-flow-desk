-- ============================================
-- MIGRAÇÃO: Consolidar RLS webhooks_queue (7→5)
-- ============================================

-- 1. Remover TODAS as 7 políticas existentes
DROP POLICY IF EXISTS "Owner/Admin full access webhooks_queue" ON public.webhooks_queue;
DROP POLICY IF EXISTS "webhooks_insert_service" ON public.webhooks_queue;
DROP POLICY IF EXISTS "webhooks_queue_insert_system" ON public.webhooks_queue;
DROP POLICY IF EXISTS "webhooks_queue_select_admin" ON public.webhooks_queue;
DROP POLICY IF EXISTS "webhooks_queue_update_admin" ON public.webhooks_queue;
DROP POLICY IF EXISTS "webhooks_select_admin" ON public.webhooks_queue;
DROP POLICY IF EXISTS "webhooks_update_admin" ON public.webhooks_queue;

-- 2. Criar 4 políticas consolidadas + 1 service
-- Lógica: Webhooks são criados por sistemas externos via service_role
-- Admin/Owner gerencia; usuários comuns NÃO interagem

-- SELECT: Somente Admin/Owner (monitoramento)
CREATE POLICY "webhooks_select_v17" ON public.webhooks_queue
FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- INSERT: NENHUMA para authenticated (só service_role cria webhooks)
-- Isso é intencional - webhooks vêm de Hotmart/sistemas externos

-- UPDATE: Admin/Owner pode reprocessar/atualizar status
CREATE POLICY "webhooks_update_v17" ON public.webhooks_queue
FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

-- DELETE: Somente Owner (webhooks são auditoria)
CREATE POLICY "webhooks_delete_v17" ON public.webhooks_queue
FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

-- SERVICE ROLE: Para edge functions receberem webhooks externos
CREATE POLICY "webhooks_service_v17" ON public.webhooks_queue
FOR ALL TO service_role
USING (true) WITH CHECK (true);