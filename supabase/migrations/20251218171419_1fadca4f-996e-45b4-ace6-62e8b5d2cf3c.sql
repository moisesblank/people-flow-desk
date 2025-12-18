-- =====================================================
-- CORREÇÃO DE SEGURANÇA - VIEWS E TABELAS RESTANTES
-- =====================================================

-- 1. BRANDING_SETTINGS - Manter público para leitura (é intencional para exibir logo/cores)
-- Já tem política "Anyone can view branding" - OK

-- 2. SOCIAL_MEDIA_METRICS - Restringir apenas para admin/marketing
ALTER TABLE public.social_media_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "social_media_admin_read" ON public.social_media_metrics;
DROP POLICY IF EXISTS "social_media_insert_admin" ON public.social_media_metrics;

CREATE POLICY "social_media_select_admin" ON public.social_media_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'marketing'))
  );

CREATE POLICY "social_media_all_admin" ON public.social_media_metrics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- 3. EDITABLE_CONTENT - Público para leitura (CMS intencional), mas escrita só admin
-- Já existe a política - verificar se está correta
ALTER TABLE public.editable_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "editable_content_public_read" ON public.editable_content;
DROP POLICY IF EXISTS "editable_content_admin_write" ON public.editable_content;

CREATE POLICY "editable_content_public_read" ON public.editable_content
  FOR SELECT USING (true);

CREATE POLICY "editable_content_admin_write" ON public.editable_content
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Criar security policy para VIEWS usando funções de segurança
-- As views herdam as políticas das tabelas base, mas vamos garantir

-- Log da correção
INSERT INTO security_events (event_type, payload, severity, source, description)
VALUES (
  'SECURITY_FIX_APPLIED',
  jsonb_build_object(
    'tables_updated', ARRAY['social_media_metrics', 'editable_content'],
    'views_noted', ARRAY['employees_public', 'employees_safe', 'dashboard_executivo', 'whatsapp_leads_dashboard'],
    'timestamp', now()
  ),
  'info',
  'security_audit',
  'Correções adicionais de RLS aplicadas'
);