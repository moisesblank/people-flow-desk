-- ============================================
-- 🛡️ SECURITY FIX: RLS para 3 tabelas expostas
-- Prompt C - Correção de Findings Críticos
-- ============================================

-- 1. team_chat_messages - Restringir a gestão (usando roles corretos do enum)
DROP POLICY IF EXISTS "team_chat_select" ON public.team_chat_messages;
DROP POLICY IF EXISTS "team_chat_insert" ON public.team_chat_messages;
DROP POLICY IF EXISTS "team_chat_update" ON public.team_chat_messages;
DROP POLICY IF EXISTS "team_chat_delete" ON public.team_chat_messages;

CREATE POLICY "team_chat_select" ON public.team_chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'employee', 'coordenacao', 'suporte', 'monitoria', 'marketing', 'contabilidade', 'moderator')
    )
  );

CREATE POLICY "team_chat_insert" ON public.team_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'employee', 'coordenacao', 'suporte', 'monitoria', 'marketing', 'contabilidade', 'moderator')
    )
  );

CREATE POLICY "team_chat_update" ON public.team_chat_messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "team_chat_delete" ON public.team_chat_messages
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR public.has_role(auth.uid(), 'owner'));

-- 2. event_consumers - Restringir a owner/admin
DROP POLICY IF EXISTS "event_consumers_select" ON public.event_consumers;
DROP POLICY IF EXISTS "event_consumers_all" ON public.event_consumers;

CREATE POLICY "event_consumers_select" ON public.event_consumers
  FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "event_consumers_all" ON public.event_consumers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- 3. video_domain_whitelist - Restringir a owner/admin
DROP POLICY IF EXISTS "video_whitelist_select" ON public.video_domain_whitelist;
DROP POLICY IF EXISTS "video_whitelist_all" ON public.video_domain_whitelist;

CREATE POLICY "video_whitelist_select" ON public.video_domain_whitelist
  FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "video_whitelist_all" ON public.video_domain_whitelist
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- 4. xp_rules - Restringir detalhes a admin
DROP POLICY IF EXISTS "xp_rules_select" ON public.xp_rules;
DROP POLICY IF EXISTS "xp_rules_all" ON public.xp_rules;

CREATE POLICY "xp_rules_select" ON public.xp_rules
  FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "xp_rules_all" ON public.xp_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));