-- ============================================================
-- 🛡️ MIGRAÇÃO DE SEGURANÇA v3 - CORREÇÃO SEARCH_PATH
-- Corrige funções SECURITY DEFINER sem search_path definido
-- ============================================================

-- 1. Drop e recriar audit_rls_coverage
DROP FUNCTION IF EXISTS public.audit_rls_coverage();

CREATE FUNCTION public.audit_rls_coverage()
RETURNS TABLE(table_name TEXT, has_rls BOOLEAN, policy_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.relname::TEXT as table_name,
    c.relrowsecurity as has_rls,
    (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = c.relname)::BIGINT as policy_count
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  ORDER BY c.relname;
END;
$$;

-- 2. Corrigir cleanup_expired_sessions
DROP FUNCTION IF EXISTS public.cleanup_expired_sessions();

CREATE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.active_sessions 
  WHERE expires_at < NOW() OR status = 'revoked';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- 3. Corrigir cleanup_old_security_events
DROP FUNCTION IF EXISTS public.cleanup_old_security_events(INTEGER);

CREATE FUNCTION public.cleanup_old_security_events(p_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.security_events 
  WHERE created_at < NOW() - (p_days || ' days')::INTERVAL
    AND severity NOT IN ('critical', 'error');
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- 4. Corrigir mark_webhook_processed
DROP FUNCTION IF EXISTS public.mark_webhook_processed(UUID, TEXT);

CREATE FUNCTION public.mark_webhook_processed(
  p_webhook_id UUID,
  p_result TEXT DEFAULT 'success'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.webhooks_queue 
  SET 
    status = 'processed',
    processed_at = NOW(),
    attempts = attempts + 1
  WHERE id = p_webhook_id;
  RETURN FOUND;
END;
$$;

-- 5. Corrigir revoke_other_sessions_v2
DROP FUNCTION IF EXISTS public.revoke_other_sessions_v2(UUID);

CREATE FUNCTION public.revoke_other_sessions_v2(
  p_current_session_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_revoked INTEGER;
BEGIN
  UPDATE public.active_sessions
  SET 
    status = 'revoked',
    revoked_at = NOW(),
    revoked_reason = 'user_initiated'
  WHERE user_id = auth.uid()
    AND id != COALESCE(p_current_session_id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND status = 'active';
  GET DIAGNOSTICS v_revoked = ROW_COUNT;
  RETURN v_revoked;
END;
$$;

-- 6. Corrigir validate_session_v2
DROP FUNCTION IF EXISTS public.validate_session_v2(TEXT);

CREATE FUNCTION public.validate_session_v2(
  p_session_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT * INTO v_session
  FROM public.active_sessions
  WHERE session_token = p_session_token
    AND status = 'active'
    AND expires_at > NOW();
  
  IF v_session IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'session_not_found');
  END IF;
  
  UPDATE public.active_sessions
  SET last_activity_at = NOW()
  WHERE id = v_session.id;
  
  RETURN jsonb_build_object(
    'valid', true,
    'user_id', v_session.user_id,
    'device_hash', v_session.device_hash,
    'expires_at', v_session.expires_at
  );
END;
$$;

-- ============================================================
-- 7. ÍNDICES DE PERFORMANCE PARA 5000+ USUÁRIOS (sem NOW())
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_sna_jobs_status_priority 
ON public.sna_jobs (status, priority, created_at);

CREATE INDEX IF NOT EXISTS idx_sna_jobs_correlation 
ON public.sna_jobs (correlation_id);

CREATE INDEX IF NOT EXISTS idx_sna_jobs_locked 
ON public.sna_jobs (locked_by, locked_at);

CREATE INDEX IF NOT EXISTS idx_sna_tool_runs_created 
ON public.sna_tool_runs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sna_tool_runs_user 
ON public.sna_tool_runs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sna_cache_expires 
ON public.sna_cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_sna_rate_limits_window 
ON public.sna_rate_limits (window_start DESC);

CREATE INDEX IF NOT EXISTS idx_sna_health_service_time 
ON public.sna_healthchecks (service, created_at DESC);

-- ============================================================
-- 8. FUNÇÃO DE MÉTRICAS EM TEMPO REAL PARA DASHBOARD
-- ============================================================

CREATE OR REPLACE FUNCTION public.sna_realtime_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', NOW(),
    'jobs', jsonb_build_object(
      'pending', (SELECT COUNT(*) FROM public.sna_jobs WHERE status = 'pending'),
      'running', (SELECT COUNT(*) FROM public.sna_jobs WHERE status = 'running'),
      'succeeded_1h', (SELECT COUNT(*) FROM public.sna_jobs WHERE status = 'succeeded' AND completed_at > NOW() - INTERVAL '1 hour'),
      'failed_1h', (SELECT COUNT(*) FROM public.sna_jobs WHERE status IN ('failed', 'dead') AND completed_at > NOW() - INTERVAL '1 hour')
    ),
    'cache', (
      SELECT jsonb_build_object(
        'entries', COUNT(*),
        'total_hits', COALESCE(SUM(hit_count), 0),
        'hit_rate', CASE 
          WHEN SUM(hit_count) > 0 THEN ROUND((SUM(hit_count)::NUMERIC / NULLIF(COUNT(*), 0)), 2)
          ELSE 0 
        END
      )
      FROM public.sna_cache WHERE expires_at > NOW()
    ),
    'health', (
      SELECT jsonb_object_agg(
        service, 
        jsonb_build_object('ok', ok, 'latency_ms', latency_ms, 'checked_at', created_at)
      )
      FROM (
        SELECT DISTINCT ON (service) service, ok, latency_ms, created_at
        FROM public.sna_healthchecks
        ORDER BY service, created_at DESC
      ) latest
    ),
    'rate_limits', (
      SELECT jsonb_build_object(
        'active', COUNT(DISTINCT identifier),
        'blocked_1h', SUM(CASE WHEN blocked_until > NOW() THEN 1 ELSE 0 END)
      )
      FROM public.sna_rate_limits
      WHERE window_start > NOW() - INTERVAL '1 hour'
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- ============================================================
-- 9. FUNÇÃO PARA VERIFICAÇÃO DE SAÚDE COMPLETA
-- ============================================================

CREATE OR REPLACE FUNCTION public.sna_system_health()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
STABLE
AS $$
DECLARE
  v_result JSONB;
  v_db_size BIGINT;
  v_connections INT;
BEGIN
  SELECT pg_database_size(current_database()) INTO v_db_size;
  SELECT COUNT(*) INTO v_connections FROM pg_stat_activity WHERE state = 'active';
  
  SELECT jsonb_build_object(
    'status', CASE 
      WHEN v_connections > 80 THEN 'critical'
      WHEN v_connections > 50 THEN 'warning'
      ELSE 'healthy'
    END,
    'database', jsonb_build_object(
      'size_mb', ROUND(v_db_size / 1024.0 / 1024.0, 2),
      'connections', v_connections,
      'max_connections', 100
    ),
    'sna', jsonb_build_object(
      'jobs_pending', (SELECT COUNT(*) FROM public.sna_jobs WHERE status = 'pending'),
      'jobs_stuck', (SELECT COUNT(*) FROM public.sna_jobs WHERE status = 'running' AND locked_at < NOW() - INTERVAL '30 minutes'),
      'cache_entries', (SELECT COUNT(*) FROM public.sna_cache WHERE expires_at > NOW()),
      'budgets_critical', (SELECT COUNT(*) FROM public.sna_budgets WHERE spent_usd > limit_usd * 0.9 AND is_active)
    ),
    'checked_at', NOW()
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Comentários
COMMENT ON FUNCTION public.sna_realtime_stats() IS 'SNA OMEGA: Estatísticas em tempo real para dashboard';
COMMENT ON FUNCTION public.sna_system_health() IS 'SNA OMEGA: Verificação completa de saúde do sistema';