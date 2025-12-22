-- ============================================================
-- SNA OMEGA v5.0 - PARTE 5: Funções de Budget, Feature, Cache e Métricas
-- ============================================================

-- 4.7 Atualizar budget após uso
CREATE OR REPLACE FUNCTION public.sna_consume_budget(
  p_scope TEXT,
  p_scope_id TEXT,
  p_cost_usd NUMERIC,
  p_request_count INT DEFAULT 1,
  p_token_count INT DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.sna_budgets
  SET 
    spent_usd = spent_usd + p_cost_usd,
    request_count = request_count + p_request_count,
    token_count = token_count + p_token_count
  WHERE scope = p_scope AND scope_id = p_scope_id
    AND period_start <= NOW() AND period_end >= NOW()
    AND is_active = TRUE;
  
  RETURN FOUND;
END;
$$;

-- 4.8 Feature flag avançado
CREATE OR REPLACE FUNCTION public.sna_check_feature(
  p_flag_key TEXT,
  p_user_id UUID DEFAULT NULL,
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
DECLARE
  v_flag RECORD;
  v_user_role TEXT;
  v_enabled BOOLEAN := false;
  v_reason TEXT := 'flag_not_found';
BEGIN
  SELECT * INTO v_flag FROM public.sna_feature_flags WHERE flag_key = p_flag_key;
  
  IF v_flag IS NULL THEN
    RETURN jsonb_build_object('enabled', false, 'reason', 'flag_not_found');
  END IF;
  
  IF NOT v_flag.is_enabled THEN
    RETURN jsonb_build_object(
      'enabled', false, 
      'reason', 'globally_disabled',
      'config', v_flag.config
    );
  END IF;
  
  IF p_user_id IS NOT NULL AND v_flag.blocked_users IS NOT NULL THEN
    IF p_user_id = ANY(v_flag.blocked_users) THEN
      RETURN jsonb_build_object('enabled', false, 'reason', 'user_blocked');
    END IF;
  END IF;
  
  IF p_user_id IS NOT NULL AND v_flag.allowed_users IS NOT NULL AND array_length(v_flag.allowed_users, 1) > 0 THEN
    IF p_user_id = ANY(v_flag.allowed_users) THEN
      RETURN jsonb_build_object('enabled', true, 'reason', 'user_allowed', 'config', v_flag.config);
    END IF;
  END IF;
  
  IF p_user_id IS NOT NULL AND array_length(v_flag.allowed_roles, 1) > 0 THEN
    SELECT role::TEXT INTO v_user_role FROM public.user_roles WHERE user_id = p_user_id LIMIT 1;
    
    IF v_user_role IS NULL OR NOT (v_user_role = ANY(v_flag.allowed_roles)) THEN
      RETURN jsonb_build_object('enabled', false, 'reason', 'role_not_allowed', 'user_role', v_user_role);
    END IF;
  END IF;
  
  IF v_flag.rollout_percentage < 100 THEN
    IF p_user_id IS NOT NULL THEN
      v_enabled := (abs(hashtext(p_user_id::TEXT || p_flag_key)) % 100) < v_flag.rollout_percentage;
      v_reason := CASE WHEN v_enabled THEN 'rollout_included' ELSE 'rollout_excluded' END;
    ELSE
      v_enabled := false;
      v_reason := 'no_user_for_rollout';
    END IF;
  ELSE
    v_enabled := true;
    v_reason := 'enabled';
  END IF;
  
  RETURN jsonb_build_object(
    'enabled', v_enabled,
    'reason', v_reason,
    'config', v_flag.config,
    'rollout_percentage', v_flag.rollout_percentage
  );
END;
$$;

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
SET search_path = 'public'
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
SET search_path = 'public'
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
SET search_path = 'public'
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
SET search_path = 'public'
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
      'total', (SELECT SUM(count) FROM job_stats),
      'success_rate', (SELECT ROUND((SUM(CASE WHEN status = 'succeeded' THEN count ELSE 0 END)::NUMERIC / NULLIF(SUM(count), 0) * 100), 2) FROM job_stats)
    ),
    'tools', (SELECT jsonb_object_agg(tool_name || '/' || provider, jsonb_build_object(
      'calls', calls,
      'success_rate', ROUND((success_count::NUMERIC / NULLIF(calls, 0) * 100), 2),
      'avg_latency_ms', avg_latency_ms,
      'p95_latency_ms', p95_latency_ms,
      'cost_usd', total_cost_usd,
      'tokens', total_tokens_in + total_tokens_out,
      'cache_hit_rate', ROUND((cache_hits::NUMERIC / NULLIF(calls, 0) * 100), 2)
    )) FROM tool_stats),
    'queue', jsonb_build_object(
      'total_pending', (SELECT COALESCE(SUM(pending_count), 0) FROM queue_stats),
      'by_priority', (SELECT jsonb_object_agg('p' || priority, jsonb_build_object(
        'count', pending_count,
        'oldest_seconds', avg_age_seconds
      )) FROM queue_stats)
    ),
    'health', (SELECT jsonb_object_agg(service, jsonb_build_object(
      'ok', ok,
      'latency_ms', latency_ms,
      'checked_at', created_at,
      'changed', status_changed
    )) FROM health_latest),
    'cache', (SELECT jsonb_build_object(
      'entries', entries,
      'total_hits', total_hits,
      'saved_usd', total_saved_usd
    ) FROM cache_stats),
    'budgets', (
      SELECT jsonb_agg(jsonb_build_object(
        'scope', scope,
        'scope_id', scope_id,
        'period', period,
        'limit_usd', limit_usd,
        'spent_usd', spent_usd,
        'remaining_usd', GREATEST(0, limit_usd - spent_usd),
        'usage_pct', ROUND((spent_usd / NULLIF(limit_usd, 0) * 100), 2),
        'request_count', request_count,
        'token_count', token_count
      ))
      FROM public.sna_budgets
      WHERE is_active AND period_end >= NOW()
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Comentários
COMMENT ON FUNCTION public.sna_consume_budget IS '🧠 SNA: Consumir orçamento após uso';
COMMENT ON FUNCTION public.sna_check_feature IS '🧠 SNA: Verificar feature flag com rollout';
COMMENT ON FUNCTION public.sna_log_tool_run IS '🧠 SNA: Registrar execução de ferramenta IA';
COMMENT ON FUNCTION public.sna_cache_get IS '🧠 SNA: Buscar valor do cache';
COMMENT ON FUNCTION public.sna_cache_set IS '🧠 SNA: Salvar valor no cache';
COMMENT ON FUNCTION public.sna_get_metrics IS '🧠 SNA: Obter métricas completas do sistema';