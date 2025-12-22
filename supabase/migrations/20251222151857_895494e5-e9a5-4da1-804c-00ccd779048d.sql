-- ============================================================
-- 🧠 SNA OMEGA v5.0 - PARTE 10: FUNÇÕES AVANÇADAS + RLS
-- ============================================================

-- 4.9 Registrar tool run com custo
CREATE OR REPLACE FUNCTION public.sna_log_tool_run(
  p_tool_name TEXT,
  p_provider TEXT,
  p_model TEXT DEFAULT NULL,
  p_ok BOOLEAN DEFAULT false,
  p_latency_ms INT DEFAULT NULL,
  p_tokens_in INT DEFAULT 0,
  p_tokens_out INT DEFAULT 0,
  p_cost_usd NUMERIC DEFAULT 0,
  p_job_id UUID DEFAULT NULL,
  p_correlation_id UUID DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_cache_hit BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run_id UUID;
BEGIN
  INSERT INTO public.sna_tool_runs (
    tool_name, provider, model, ok, latency_ms, tokens_in, tokens_out, cost_usd,
    job_id, correlation_id, error_message, cache_hit, user_id
  ) VALUES (
    p_tool_name, p_provider, p_model, p_ok, p_latency_ms, p_tokens_in, p_tokens_out, p_cost_usd,
    p_job_id, p_correlation_id, p_error_message, p_cache_hit, auth.uid()
  )
  RETURNING id INTO v_run_id;
  
  IF p_cost_usd > 0 THEN
    PERFORM public.sna_consume_budget('global', 'global', p_cost_usd, 1, p_tokens_in + p_tokens_out);
    PERFORM public.sna_consume_budget('tool', p_tool_name, p_cost_usd, 1, p_tokens_in + p_tokens_out);
  END IF;
  
  RETURN v_run_id;
END;
$$;

-- 4.10 Cache get/set
CREATE OR REPLACE FUNCTION public.sna_cache_get(p_cache_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cached RECORD;
BEGIN
  SELECT * INTO v_cached
  FROM public.sna_cache
  WHERE cache_key = p_cache_key AND expires_at > NOW();
  
  IF v_cached IS NULL THEN
    RETURN jsonb_build_object('hit', false);
  END IF;
  
  UPDATE public.sna_cache
  SET hit_count = hit_count + 1, last_hit_at = NOW()
  WHERE cache_key = p_cache_key;
  
  RETURN jsonb_build_object(
    'hit', true,
    'value', v_cached.cached_value,
    'hit_count', v_cached.hit_count + 1,
    'saved_cost_usd', v_cached.original_cost_usd
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.sna_cache_set(
  p_cache_key TEXT,
  p_value JSONB,
  p_ttl_seconds INT DEFAULT 3600,
  p_original_cost_usd NUMERIC DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.sna_cache (cache_key, cached_value, expires_at, original_cost_usd)
  VALUES (p_cache_key, p_value, NOW() + (p_ttl_seconds || ' seconds')::INTERVAL, p_original_cost_usd)
  ON CONFLICT (cache_key) DO UPDATE SET
    cached_value = EXCLUDED.cached_value,
    expires_at = EXCLUDED.expires_at,
    hit_count = 0,
    last_hit_at = NULL;
  
  RETURN true;
END;
$$;

-- 4.11 Métricas completas
CREATE OR REPLACE FUNCTION public.sna_get_metrics(
  p_hours INT DEFAULT 24,
  p_include_details BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH job_stats AS (
    SELECT 
      status,
      COUNT(*) as count,
      AVG(processing_time_ms)::INT as avg_time_ms,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time_ms)::INT as p95_time_ms,
      SUM(actual_cost_usd) as total_cost_usd,
      SUM(tokens_in) as total_tokens_in,
      SUM(tokens_out) as total_tokens_out
    FROM public.sna_jobs
    WHERE created_at > NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY status
  ),
  tool_stats AS (
    SELECT 
      tool_name,
      provider,
      COUNT(*) as calls,
      SUM(CASE WHEN ok THEN 1 ELSE 0 END) as success_count,
      AVG(latency_ms)::INT as avg_latency_ms,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms)::INT as p95_latency_ms,
      SUM(cost_usd) as total_cost_usd,
      SUM(tokens_in) as total_tokens_in,
      SUM(tokens_out) as total_tokens_out,
      SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits
    FROM public.sna_tool_runs
    WHERE created_at > NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY tool_name, provider
  ),
  queue_stats AS (
    SELECT 
      priority,
      COUNT(*) as pending_count,
      MIN(created_at) as oldest_job,
      AVG(EXTRACT(EPOCH FROM (NOW() - created_at)))::INT as avg_age_seconds
    FROM public.sna_jobs
    WHERE status IN ('pending', 'scheduled')
    GROUP BY priority
  ),
  health_latest AS (
    SELECT DISTINCT ON (service)
      service,
      ok,
      latency_ms,
      created_at,
      status_changed
    FROM public.sna_healthchecks
    ORDER BY service, created_at DESC
  ),
  cache_stats AS (
    SELECT 
      SUM(hit_count) as total_hits,
      SUM(saved_cost_usd) as total_saved_usd,
      COUNT(*) as entries
    FROM public.sna_cache
    WHERE expires_at > NOW()
  )
  SELECT jsonb_build_object(
    'period_hours', p_hours,
    'generated_at', NOW(),
    'jobs', jsonb_build_object(
      'by_status', (SELECT jsonb_object_agg(status, jsonb_build_object(
        'count', count, 
        'avg_time_ms', avg_time_ms,
        'p95_time_ms', p95_time_ms,
        'cost_usd', total_cost_usd
      )) FROM job_stats),
      'total', (SELECT COALESCE(SUM(count), 0) FROM job_stats),
      'success_rate', (SELECT ROUND((SUM(CASE WHEN status = 'succeeded' THEN count ELSE 0 END)::NUMERIC / NULLIF(SUM(count), 0) * 100), 2) FROM job_stats)
    ),
    'tools', (SELECT COALESCE(jsonb_object_agg(tool_name || '/' || provider, jsonb_build_object(
      'calls', calls,
      'success_rate', ROUND((success_count::NUMERIC / NULLIF(calls, 0) * 100), 2),
      'avg_latency_ms', avg_latency_ms,
      'p95_latency_ms', p95_latency_ms,
      'cost_usd', total_cost_usd,
      'tokens', total_tokens_in + total_tokens_out,
      'cache_hit_rate', ROUND((cache_hits::NUMERIC / NULLIF(calls, 0) * 100), 2)
    )), '{}'::jsonb) FROM tool_stats),
    'queue', jsonb_build_object(
      'total_pending', (SELECT COALESCE(SUM(pending_count), 0) FROM queue_stats),
      'by_priority', (SELECT COALESCE(jsonb_object_agg('p' || priority, jsonb_build_object(
        'count', pending_count,
        'oldest_seconds', avg_age_seconds
      )), '{}'::jsonb) FROM queue_stats)
    ),
    'health', (SELECT COALESCE(jsonb_object_agg(service, jsonb_build_object(
      'ok', ok,
      'latency_ms', latency_ms,
      'checked_at', created_at,
      'changed', status_changed
    )), '{}'::jsonb) FROM health_latest),
    'cache', (SELECT COALESCE(jsonb_build_object(
      'entries', entries,
      'total_hits', total_hits,
      'saved_usd', total_saved_usd
    ), '{}'::jsonb) FROM cache_stats),
    'budgets', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'scope', scope,
        'scope_id', scope_id,
        'period', period,
        'limit_usd', limit_usd,
        'spent_usd', spent_usd,
        'remaining_usd', GREATEST(0, limit_usd - spent_usd),
        'usage_pct', ROUND((spent_usd / NULLIF(limit_usd, 0) * 100), 2),
        'request_count', request_count,
        'token_count', token_count
      )), '[]'::jsonb)
      FROM public.sna_budgets
      WHERE is_active AND period_end >= NOW()
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 4.12 Cleanup automático
CREATE OR REPLACE FUNCTION public.sna_cleanup(
  p_job_retention_days INT DEFAULT 30,
  p_tool_run_retention_days INT DEFAULT 7,
  p_cache_cleanup BOOLEAN DEFAULT true,
  p_rate_limit_cleanup BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_jobs INT := 0;
  v_deleted_runs INT := 0;
  v_deleted_cache INT := 0;
  v_deleted_rate INT := 0;
  v_released_stuck INT := 0;
BEGIN
  DELETE FROM public.sna_jobs
  WHERE status IN ('succeeded', 'dead', 'cancelled')
    AND created_at < NOW() - (p_job_retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted_jobs = ROW_COUNT;
  
  DELETE FROM public.sna_tool_runs
  WHERE created_at < NOW() - (p_tool_run_retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted_runs = ROW_COUNT;
  
  IF p_cache_cleanup THEN
    DELETE FROM public.sna_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS v_deleted_cache = ROW_COUNT;
  END IF;
  
  IF p_rate_limit_cleanup THEN
    DELETE FROM public.sna_rate_limits
    WHERE window_start < NOW() - INTERVAL '1 day';
    GET DIAGNOSTICS v_deleted_rate = ROW_COUNT;
  END IF;
  
  UPDATE public.sna_jobs
  SET status = 'pending', locked_at = NULL, locked_by = NULL, lock_token = NULL
  WHERE status = 'running' AND locked_at < NOW() - INTERVAL '30 minutes';
  GET DIAGNOSTICS v_released_stuck = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'deleted_jobs', v_deleted_jobs,
    'deleted_tool_runs', v_deleted_runs,
    'deleted_cache', v_deleted_cache,
    'deleted_rate_limits', v_deleted_rate,
    'released_stuck_jobs', v_released_stuck
  );
END;
$$;

-- ============================================================
-- PARTE 5: RLS COMPLETO + FUNÇÃO ADMIN
-- ============================================================

-- Função de verificação de admin SNA
CREATE OR REPLACE FUNCTION public.is_sna_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role IN ('owner', 'admin', 'coordenacao');
END;
$$;

-- Políticas para sna_jobs
DROP POLICY IF EXISTS "sna_jobs_select" ON public.sna_jobs;
CREATE POLICY "sna_jobs_select" ON public.sna_jobs
  FOR SELECT USING (created_by = auth.uid() OR public.is_sna_admin());

DROP POLICY IF EXISTS "sna_jobs_insert" ON public.sna_jobs;
CREATE POLICY "sna_jobs_insert" ON public.sna_jobs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "sna_jobs_update" ON public.sna_jobs;
CREATE POLICY "sna_jobs_update" ON public.sna_jobs
  FOR UPDATE USING (public.is_sna_admin());

-- Políticas para sna_tool_runs
DROP POLICY IF EXISTS "sna_tool_runs_select" ON public.sna_tool_runs;
CREATE POLICY "sna_tool_runs_select" ON public.sna_tool_runs
  FOR SELECT USING (user_id = auth.uid() OR public.is_sna_admin());

DROP POLICY IF EXISTS "sna_tool_runs_insert" ON public.sna_tool_runs;
CREATE POLICY "sna_tool_runs_insert" ON public.sna_tool_runs
  FOR INSERT WITH CHECK (TRUE);

-- Políticas admin-only
DROP POLICY IF EXISTS "sna_budgets_admin" ON public.sna_budgets;
CREATE POLICY "sna_budgets_admin" ON public.sna_budgets
  FOR ALL USING (public.is_sna_admin());

DROP POLICY IF EXISTS "sna_health_admin" ON public.sna_healthchecks;
CREATE POLICY "sna_health_admin" ON public.sna_healthchecks
  FOR ALL USING (public.is_sna_admin());

DROP POLICY IF EXISTS "sna_flags_select" ON public.sna_feature_flags;
CREATE POLICY "sna_flags_select" ON public.sna_feature_flags
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "sna_flags_manage" ON public.sna_feature_flags;
CREATE POLICY "sna_flags_manage" ON public.sna_feature_flags
  FOR ALL USING (public.is_sna_admin());

DROP POLICY IF EXISTS "sna_rate_all" ON public.sna_rate_limits;
CREATE POLICY "sna_rate_all" ON public.sna_rate_limits FOR ALL USING (TRUE);

DROP POLICY IF EXISTS "sna_cache_all" ON public.sna_cache;
CREATE POLICY "sna_cache_all" ON public.sna_cache FOR ALL USING (TRUE);

-- Remover políticas duplicadas de conversations/messages
DROP POLICY IF EXISTS "sna_conv_user_own" ON public.sna_conversations;
DROP POLICY IF EXISTS "sna_conv_admin_all" ON public.sna_conversations;
DROP POLICY IF EXISTS "sna_msg_user_own" ON public.sna_messages;
DROP POLICY IF EXISTS "sna_msg_admin_all" ON public.sna_messages;
DROP POLICY IF EXISTS "sna_embed_read_auth" ON public.sna_embeddings;
DROP POLICY IF EXISTS "sna_embed_admin_manage" ON public.sna_embeddings;

-- Novas políticas consolidadas
DROP POLICY IF EXISTS "sna_conv_own" ON public.sna_conversations;
CREATE POLICY "sna_conv_own" ON public.sna_conversations
  FOR ALL USING (user_id = auth.uid() OR public.is_sna_admin());

DROP POLICY IF EXISTS "sna_msg_own" ON public.sna_messages;
CREATE POLICY "sna_msg_own" ON public.sna_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sna_conversations c 
      WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR public.is_sna_admin())
    )
  );

DROP POLICY IF EXISTS "sna_embed_admin" ON public.sna_embeddings;
CREATE POLICY "sna_embed_admin" ON public.sna_embeddings
  FOR ALL USING (public.is_sna_admin());