
-- ============================================
-- MATRIZ FUNCIONALIDADES OMEGA - PARTE 2 (FIX 2)
-- Drop explícito de todas as variantes
-- ============================================

-- Drop TODAS as variantes possíveis da função
DROP FUNCTION IF EXISTS is_admin_or_owner();
DROP FUNCTION IF EXISTS is_admin_or_owner_v2();
DROP FUNCTION IF EXISTS public.is_admin_or_owner();
DROP FUNCTION IF EXISTS public.is_admin_or_owner_v2();

-- Recriar com nome único e schema explícito
CREATE OR REPLACE FUNCTION public.is_matrix_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5.1 Obter estatísticas de dead clicks
CREATE OR REPLACE FUNCTION public.get_dead_click_stats(p_days INTEGER DEFAULT 7)
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
      COUNT(*) FILTER (WHERE NOT dcr.resolved) as unresolved,
      COUNT(*) FILTER (WHERE dcr.resolved) as resolved,
      COUNT(DISTINCT dcr.page_path) as pages,
      COUNT(DISTINCT dcr.element_selector) as selectors
    FROM public.dead_click_reports dcr
    WHERE dcr.created_at > now() - (p_days || ' days')::interval
  ),
  top AS (
    SELECT dcr2.page_path, COUNT(*) as cnt
    FROM public.dead_click_reports dcr2
    WHERE dcr2.created_at > now() - (p_days || ' days')::interval
    GROUP BY dcr2.page_path
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
  LEFT JOIN top t ON TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 Resolver dead click
CREATE OR REPLACE FUNCTION public.resolve_dead_click(
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
CREATE OR REPLACE FUNCTION public.get_url_access_stats(p_days INTEGER DEFAULT 7)
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
      COUNT(*) FILTER (WHERE ual.allowed) as allowed,
      COUNT(*) FILTER (WHERE NOT ual.allowed) as denied,
      COUNT(DISTINCT ual.user_id) as users
    FROM public.url_access_logs ual
    WHERE ual.created_at > now() - (p_days || ' days')::interval
  ),
  top_denied AS (
    SELECT ual2.path, COUNT(*) as cnt
    FROM public.url_access_logs ual2
    WHERE ual2.created_at > now() - (p_days || ' days')::interval
    AND NOT ual2.allowed
    GROUP BY ual2.path
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
CREATE OR REPLACE FUNCTION public.log_url_access(
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
CREATE OR REPLACE FUNCTION public.run_ui_audit()
RETURNS TABLE(
  audit_type TEXT,
  audit_name TEXT,
  status TEXT,
  count BIGINT,
  details JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'dead_clicks'::TEXT,
    'Cliques sem destino'::TEXT,
    CASE WHEN COUNT(*) FILTER (WHERE NOT dcr.resolved) = 0 THEN 'pass' ELSE 'fail' END,
    COUNT(*) FILTER (WHERE NOT dcr.resolved),
    jsonb_build_object('total', COUNT(*), 'resolved', COUNT(*) FILTER (WHERE dcr.resolved))
  FROM public.dead_click_reports dcr
  WHERE dcr.created_at > now() - interval '7 days';
  
  RETURN QUERY
  SELECT 
    'access_denied'::TEXT,
    'Acessos negados'::TEXT,
    CASE WHEN COUNT(*) FILTER (WHERE NOT ual.allowed) < 100 THEN 'pass' ELSE 'warn' END,
    COUNT(*) FILTER (WHERE NOT ual.allowed),
    jsonb_build_object('total', COUNT(*), 'allowed', COUNT(*) FILTER (WHERE ual.allowed))
  FROM public.url_access_logs ual
  WHERE ual.created_at > now() - interval '7 days';
  
  RETURN QUERY
  SELECT 
    'functions'::TEXT,
    'Funções registradas'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'pass' ELSE 'warn' END,
    COUNT(*),
    jsonb_build_object('active', COUNT(*) FILTER (WHERE ufr.status = 'active'))
  FROM public.ui_function_registry ufr;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS POLICIES COM is_matrix_admin
DROP POLICY IF EXISTS "dcr_select" ON public.dead_click_reports;
CREATE POLICY "dcr_select" ON public.dead_click_reports
  FOR SELECT USING (public.is_matrix_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS "dcr_update" ON public.dead_click_reports;
CREATE POLICY "dcr_update" ON public.dead_click_reports
  FOR UPDATE USING (public.is_matrix_admin());

DROP POLICY IF EXISTS "ufr_all" ON public.ui_function_registry;
DROP POLICY IF EXISTS "ufr_admin" ON public.ui_function_registry;
CREATE POLICY "ufr_admin_all" ON public.ui_function_registry
  FOR ALL USING (public.is_matrix_admin());

DROP POLICY IF EXISTS "uae_select" ON public.ui_audit_events;
CREATE POLICY "uae_select" ON public.ui_audit_events
  FOR SELECT USING (public.is_matrix_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS "ual_select" ON public.url_access_logs;
CREATE POLICY "ual_select" ON public.url_access_logs
  FOR SELECT USING (public.is_matrix_admin() OR user_id = auth.uid());

-- GRANTS
GRANT UPDATE ON public.dead_click_reports TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dead_click_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_dead_click TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_url_access_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_url_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_ui_audit TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_matrix_admin TO authenticated;
