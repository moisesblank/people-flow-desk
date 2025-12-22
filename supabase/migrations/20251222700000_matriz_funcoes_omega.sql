-- ============================================
-- 🔥🛡️ MATRIZ DE FUNCIONALIDADES OMEGA 🛡️🔥
-- Tabelas para ZERO CLIQUES MORTOS
-- ============================================

-- ============================================
-- 1. TABELA: dead_click_reports
-- Registra cliques em elementos sem destino
-- ============================================
CREATE TABLE IF NOT EXISTS public.dead_click_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Elemento
  element_type TEXT NOT NULL,
  element_text TEXT,
  element_selector TEXT NOT NULL,
  
  -- Página
  page_url TEXT NOT NULL,
  page_path TEXT NOT NULL,
  
  -- Usuário
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT NULL,
  
  -- Dispositivo
  device_info JSONB NULL,
  
  -- Contexto
  component_name TEXT NULL,
  action_expected TEXT NULL,
  issues TEXT[] NULL,
  
  -- Status
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ NULL,
  resolved_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dcr_page_path ON public.dead_click_reports(page_path);
CREATE INDEX IF NOT EXISTS idx_dcr_resolved ON public.dead_click_reports(resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dcr_user ON public.dead_click_reports(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dcr_created ON public.dead_click_reports(created_at DESC);

-- ============================================
-- 2. TABELA: ui_function_registry
-- Registro central de funções do sistema
-- ============================================
CREATE TABLE IF NOT EXISTS public.ui_function_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  function_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Domínio
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  
  -- UI
  ui_triggers JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Rota/Ação
  route_key TEXT NULL,
  action_key TEXT NULL,
  
  -- Backend
  backend_mode TEXT NOT NULL DEFAULT 'supabase-client',
  backend_handlers JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Storage
  storage_operations JSONB NULL,
  
  -- Segurança
  auth_required BOOLEAN NOT NULL DEFAULT TRUE,
  roles_allowed TEXT[] NOT NULL DEFAULT ARRAY['owner'],
  rls_tables TEXT[] NULL,
  abuse_controls TEXT[] NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_ufr_domain ON public.ui_function_registry(domain);
CREATE INDEX IF NOT EXISTS idx_ufr_status ON public.ui_function_registry(status);

-- ============================================
-- 3. TABELA: ui_audit_events
-- Log de eventos de auditoria de UI
-- ============================================
CREATE TABLE IF NOT EXISTS public.ui_audit_events (
  id BIGSERIAL PRIMARY KEY,
  
  -- Evento
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  
  -- Contexto
  page_path TEXT NOT NULL,
  function_id TEXT NULL,
  component_name TEXT NULL,
  
  -- Resultado
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT NULL,
  
  -- Usuário
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT NULL,
  session_id TEXT NULL,
  
  -- Dados
  metadata JSONB NULL DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_uae_type ON public.ui_audit_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uae_user ON public.ui_audit_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_uae_path ON public.ui_audit_events(page_path, created_at DESC);

-- ============================================
-- 4. TABELA: url_access_logs
-- Log de acessos por URL
-- ============================================
CREATE TABLE IF NOT EXISTS public.url_access_logs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Acesso
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  domain TEXT NOT NULL,
  
  -- Resultado
  allowed BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  redirect_to TEXT NULL,
  
  -- Usuário
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT NULL,
  
  -- Dispositivo
  ip INET NULL,
  user_agent TEXT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ual_path ON public.url_access_logs(path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ual_user ON public.url_access_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ual_denied ON public.url_access_logs(allowed, created_at DESC) WHERE allowed = FALSE;

-- ============================================
-- 5. FUNÇÕES SQL
-- ============================================

-- 5.1 Obter estatísticas de dead clicks
CREATE OR REPLACE FUNCTION get_dead_click_stats(p_days INTEGER DEFAULT 7)
RETURNS TABLE(
  total_reports BIGINT,
  unresolved_reports BIGINT,
  resolved_reports BIGINT,
  unique_pages BIGINT,
  unique_selectors BIGINT,
  top_page TEXT,
  top_page_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE NOT resolved) as unresolved,
      COUNT(*) FILTER (WHERE resolved) as resolved,
      COUNT(DISTINCT page_path) as pages,
      COUNT(DISTINCT element_selector) as selectors
    FROM public.dead_click_reports
    WHERE created_at > now() - (p_days || ' days')::interval
  ),
  top AS (
    SELECT page_path, COUNT(*) as cnt
    FROM public.dead_click_reports
    WHERE created_at > now() - (p_days || ' days')::interval
    GROUP BY page_path
    ORDER BY cnt DESC
    LIMIT 1
  )
  SELECT
    s.total,
    s.unresolved,
    s.resolved,
    s.pages,
    s.selectors,
    t.page_path,
    t.cnt
  FROM stats s
  CROSS JOIN top t;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 Resolver dead click
CREATE OR REPLACE FUNCTION resolve_dead_click(
  p_report_id UUID,
  p_resolved_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.dead_click_reports
  SET resolved = TRUE,
      resolved_at = now(),
      resolved_by = p_resolved_by,
      resolution_notes = p_notes
  WHERE id = p_report_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.3 Obter estatísticas de acesso
CREATE OR REPLACE FUNCTION get_url_access_stats(p_days INTEGER DEFAULT 7)
RETURNS TABLE(
  total_accesses BIGINT,
  allowed_accesses BIGINT,
  denied_accesses BIGINT,
  unique_users BIGINT,
  denial_rate NUMERIC,
  top_denied_path TEXT,
  top_denied_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE allowed) as allowed,
      COUNT(*) FILTER (WHERE NOT allowed) as denied,
      COUNT(DISTINCT user_id) as users
    FROM public.url_access_logs
    WHERE created_at > now() - (p_days || ' days')::interval
  ),
  top_denied AS (
    SELECT path, COUNT(*) as cnt
    FROM public.url_access_logs
    WHERE created_at > now() - (p_days || ' days')::interval
    AND NOT allowed
    GROUP BY path
    ORDER BY cnt DESC
    LIMIT 1
  )
  SELECT
    s.total,
    s.allowed,
    s.denied,
    s.users,
    ROUND((s.denied::NUMERIC / NULLIF(s.total, 0) * 100), 2),
    t.path,
    t.cnt
  FROM stats s
  LEFT JOIN top_denied t ON TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4 Log de acesso URL
CREATE OR REPLACE FUNCTION log_url_access(
  p_url TEXT,
  p_path TEXT,
  p_domain TEXT,
  p_allowed BOOLEAN,
  p_reason TEXT,
  p_redirect_to TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_user_role TEXT DEFAULT NULL,
  p_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.url_access_logs (
    url, path, domain, allowed, reason, redirect_to,
    user_id, user_role, ip, user_agent
  ) VALUES (
    p_url, p_path, p_domain, p_allowed, p_reason, p_redirect_to,
    p_user_id, p_user_role, p_ip, p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.5 Auditoria geral
CREATE OR REPLACE FUNCTION run_ui_audit()
RETURNS TABLE(
  audit_type TEXT,
  audit_name TEXT,
  status TEXT,
  count BIGINT,
  details JSONB
) AS $$
BEGIN
  -- Dead Clicks
  RETURN QUERY
  SELECT 
    'dead_clicks'::TEXT,
    'Cliques sem destino'::TEXT,
    CASE WHEN COUNT(*) FILTER (WHERE NOT resolved) = 0 THEN 'pass' ELSE 'fail' END,
    COUNT(*) FILTER (WHERE NOT resolved),
    jsonb_build_object('total', COUNT(*), 'resolved', COUNT(*) FILTER (WHERE resolved))
  FROM public.dead_click_reports
  WHERE created_at > now() - interval '7 days';
  
  -- Access Denied
  RETURN QUERY
  SELECT 
    'access_denied'::TEXT,
    'Acessos negados'::TEXT,
    CASE WHEN COUNT(*) FILTER (WHERE NOT allowed) < 100 THEN 'pass' ELSE 'warn' END,
    COUNT(*) FILTER (WHERE NOT allowed),
    jsonb_build_object('total', COUNT(*), 'allowed', COUNT(*) FILTER (WHERE allowed))
  FROM public.url_access_logs
  WHERE created_at > now() - interval '7 days';
  
  -- Functions Registry
  RETURN QUERY
  SELECT 
    'functions'::TEXT,
    'Funções registradas'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'pass' ELSE 'warn' END,
    COUNT(*),
    jsonb_build_object('active', COUNT(*) FILTER (WHERE status = 'active'))
  FROM public.ui_function_registry;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. RLS POLICIES
-- ============================================

ALTER TABLE public.dead_click_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_function_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_access_logs ENABLE ROW LEVEL SECURITY;

-- Helper
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- dead_click_reports
DROP POLICY IF EXISTS "dcr_select" ON public.dead_click_reports;
CREATE POLICY "dcr_select" ON public.dead_click_reports
  FOR SELECT USING (is_admin_or_owner() OR user_id = auth.uid());

DROP POLICY IF EXISTS "dcr_insert" ON public.dead_click_reports;
CREATE POLICY "dcr_insert" ON public.dead_click_reports
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "dcr_update" ON public.dead_click_reports;
CREATE POLICY "dcr_update" ON public.dead_click_reports
  FOR UPDATE USING (is_admin_or_owner());

-- ui_function_registry
DROP POLICY IF EXISTS "ufr_select" ON public.ui_function_registry;
CREATE POLICY "ufr_select" ON public.ui_function_registry
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "ufr_all" ON public.ui_function_registry;
CREATE POLICY "ufr_all" ON public.ui_function_registry
  FOR ALL USING (is_admin_or_owner());

-- ui_audit_events
DROP POLICY IF EXISTS "uae_select" ON public.ui_audit_events;
CREATE POLICY "uae_select" ON public.ui_audit_events
  FOR SELECT USING (is_admin_or_owner() OR user_id = auth.uid());

DROP POLICY IF EXISTS "uae_insert" ON public.ui_audit_events;
CREATE POLICY "uae_insert" ON public.ui_audit_events
  FOR INSERT WITH CHECK (TRUE);

-- url_access_logs
DROP POLICY IF EXISTS "ual_select" ON public.url_access_logs;
CREATE POLICY "ual_select" ON public.url_access_logs
  FOR SELECT USING (is_admin_or_owner() OR user_id = auth.uid());

DROP POLICY IF EXISTS "ual_insert" ON public.url_access_logs;
CREATE POLICY "ual_insert" ON public.url_access_logs
  FOR INSERT WITH CHECK (TRUE);

-- ============================================
-- 7. GRANTS
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.dead_click_reports TO authenticated;
GRANT UPDATE ON public.dead_click_reports TO authenticated;
GRANT SELECT ON public.ui_function_registry TO authenticated;
GRANT SELECT, INSERT ON public.ui_audit_events TO authenticated;
GRANT SELECT, INSERT ON public.url_access_logs TO authenticated;

GRANT EXECUTE ON FUNCTION get_dead_click_stats TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_dead_click TO authenticated;
GRANT EXECUTE ON FUNCTION get_url_access_stats TO authenticated;
GRANT EXECUTE ON FUNCTION log_url_access TO authenticated;
GRANT EXECUTE ON FUNCTION run_ui_audit TO authenticated;

-- ============================================
-- ✅ FIM DA MIGRAÇÃO MATRIZ FUNCÕES OMEGA
-- ============================================
