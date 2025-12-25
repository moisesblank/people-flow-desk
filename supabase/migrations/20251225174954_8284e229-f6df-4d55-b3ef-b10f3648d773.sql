
-- ============================================
-- MIGRAÇÃO: Consolidar RLS comissoes (6→5)
-- ============================================

-- 1. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Admins can manage comissoes" ON public.comissoes;
DROP POLICY IF EXISTS "comissoes_delete_owner" ON public.comissoes;
DROP POLICY IF EXISTS "comissoes_insert_admin" ON public.comissoes;
DROP POLICY IF EXISTS "comissoes_service_insert" ON public.comissoes;
DROP POLICY IF EXISTS "comissoes_select_secure" ON public.comissoes;
DROP POLICY IF EXISTS "comissoes_update_admin" ON public.comissoes;

-- 2. Criar 4 políticas consolidadas + 1 service
-- Lógica: Afiliados veem próprias comissões

-- SELECT: Admin/Owner vê tudo, afiliado vê próprias
CREATE POLICY "comissoes_select_v17" ON public.comissoes
FOR SELECT TO authenticated
USING (
  is_admin_or_owner(auth.uid()) OR 
  afiliado_id IN (
    SELECT id FROM affiliates 
    WHERE user_id = auth.uid()
  )
);

-- INSERT: Admin/Owner (comissões são geradas pelo sistema)
CREATE POLICY "comissoes_insert_v17" ON public.comissoes
FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

-- UPDATE: Admin/Owner (ajustes de comissão)
CREATE POLICY "comissoes_update_v17" ON public.comissoes
FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

-- DELETE: Somente Owner (dados financeiros críticos)
CREATE POLICY "comissoes_delete_v17" ON public.comissoes
FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

-- SERVICE ROLE: Para webhooks Hotmart gerar comissões
CREATE POLICY "comissoes_service_v17" ON public.comissoes
FOR ALL TO service_role
USING (true) WITH CHECK (true);
