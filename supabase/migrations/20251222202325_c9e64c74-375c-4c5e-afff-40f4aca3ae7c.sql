-- ============================================================
-- SNA OMEGA v5.0 - PARTE 4.6-4.12: FUNÇÕES AVANÇADAS
-- Budget, Feature Flags, Cache, Metrics, Cleanup
-- ============================================================

-- 4.6 Budget check com ação automática
CREATE OR REPLACE FUNCTION public.sna_check_budget(
  p_scope TEXT DEFAULT 'global',
  p_scope_id TEXT DEFAULT 'global',
  p_estimated_cost NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_budget RECORD;
  v_usage_pct NUMERIC;
  v_allowed BOOLEAN := true;
  v_action TEXT;
BEGIN
  SELECT * INTO v_budget
  FROM public.sna_budgets
  WHERE scope = p_scope AND scope_id = p_scope_id
    AND period_start <= NOW() AND period_end >= NOW()
    AND is_active = TRUE
  ORDER BY period_start DESC
  LIMIT 1;
  
  IF v_budget IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'no_budget', true);
  END IF;
  
  v_usage_pct := (v_budget.spent_usd + p_estimated_cost) / NULLIF(v_budget.limit_usd, 0);
  
  IF v_usage_pct >= 1 AND NOT v_budget.is_soft_limit THEN
    v_allowed := false;
    v_action := v_budget.action_on_limit;
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'action', v_action,
    'limit_usd', v_budget.limit_usd,
    'spent_usd', v_budget.spent_usd,
    'remaining_usd', GREATEST(0, v_budget.limit_usd - v_budget.spent_usd),
    'usage_percentage', ROUND(v_usage_pct * 100, 2),
    'warn_threshold', v_budget.warn_threshold * 100,
    'critical_threshold', v_budget.critical_threshold * 100,
    'is_warning', v_usage_pct >= v_budget.warn_threshold,
    'is_critical', v_usage_pct >= v_budget.critical_threshold
  );
END;
$$;

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
AS $$
BEGIN
  UPDATE public.sna_budgets
  SET 
    spent_usd = spent_usd + p_cost_usd,
    request_count = request_count + p_token_count
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
  
  -- Verificar se usuário está bloqueado
  IF p_user_id IS NOT NULL AND v_flag.blocked_users IS NOT NULL THEN
    IF p_user_id = ANY(v_flag.blocked_users) THEN
      RETURN jsonb_build_object('enabled', false, 'reason', 'user_blocked');
    END IF;
  END IF;
  
  -- Verificar se usuário está explicitamente permitido
  IF p_user_id IS NOT NULL AND v_flag.allowed_users IS NOT NULL AND array_length(v_flag.allowed_users, 1) > 0 THEN
    IF p_user_id = ANY(v_flag.allowed_users) THEN
      RETURN jsonb_build_object('enabled', true, 'reason', 'user_allowed', 'config', v_flag.config);
    END IF;
  END IF;
  
  -- Verificar role
  IF p_user_id IS NOT NULL AND array_length(v_flag.allowed_roles, 1) > 0 THEN
    SELECT role INTO v_user_role FROM public.profiles WHERE id = p_user_id;
    
    IF v_user_role IS NULL OR NOT (v_user_role = ANY(v_flag.allowed_roles)) THEN
      RETURN jsonb_build_object('enabled', false, 'reason', 'role_not_allowed', 'user_role', v_user_role);
    END IF;
  END IF;
  
  -- Rollout percentual
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
  
  -- Atualizar budgets
  IF p_cost_usd > 0 THEN
    PERFORM sna_consume_budget('global', 'global', p_cost_usd, 1, p_tokens_in + p_tokens_out);
    PERFORM sna_consume_budget('tool', p_tool_name, p_cost_usd, 1, p_tokens_in + p_tokens_out);
  END IF;
  
  RETURN v_run_id;
END;
$$;

-- 4.10 Cache get
CREATE OR REPLACE FUNCTION public.sna_cache_get(p_cache_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  -- Atualizar stats
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

-- 4.10b Cache set
CREATE OR REPLACE FUNCTION public.sna_cache_set(
  p_cache_key TEXT,
  p_value JSONB,
  p_ttl_seconds INT DEFAULT 3600,
  p_original_cost_usd NUMERIC DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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
AS $$
DECLARE
  v_result JSONB;
  v_jobs_by_status JSONB;
  v_jobs_total BIGINT;
  v_jobs_success_rate NUMERIC;
  v_tools JSONB;
  v_queue_total BIGINT;
  v_queue_by_priority JSONB;
  v_health JSONB;
  v_cache_stats JSONB;
  v_budgets JSONB;
BEGIN
  -- Job stats by status
  SELECT jsonb_object_agg(status, jsonb_build_object(
    'count', count, 
    'avg_time_ms', avg_time_ms,
    'p95_time_ms', p95_time_ms,
    'cost_usd', total_cost_usd
  ))
  INTO v_jobs_by_status
  FROM (
    SELECT 
      status,
      COUNT(*) as count,
      AVG(processing_time_ms)::INT as avg_time_ms,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time_ms)::INT as p95_time_ms,
      SUM(actual_cost_usd) as total_cost_usd
    FROM public.sna_jobs
    WHERE created_at > NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY status
  ) js;

  -- Jobs total and success rate
  SELECT 
    COALESCE(SUM(CASE WHEN status IS NOT NULL THEN 1 ELSE 0 END), 0),
    ROUND(COALESCE(SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 0), 2)
  INTO v_jobs_total, v_jobs_success_rate
  FROM public.sna_jobs
  WHERE created_at > NOW() - (p_hours || ' hours')::INTERVAL;

  -- Tool stats
  SELECT jsonb_object_agg(tool_key, tool_data)
  INTO v_tools
  FROM (
    SELECT 
      tool_name || '/' || provider as tool_key,
      jsonb_build_object(
        'calls', COUNT(*),
        'success_rate', ROUND((SUM(CASE WHEN ok THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2),
        'avg_latency_ms', AVG(latency_ms)::INT,
        'cost_usd', SUM(cost_usd),
        'tokens', SUM(tokens_in) + SUM(tokens_out),
        'cache_hit_rate', ROUND((SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2)
      ) as tool_data
    FROM public.sna_tool_runs
    WHERE created_at > NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY tool_name, provider
  ) ts;

  -- Queue stats
  SELECT COALESCE(SUM(cnt), 0)
  INTO v_queue_total
  FROM (
    SELECT COUNT(*) as cnt FROM public.sna_jobs WHERE status IN ('pending', 'scheduled')
  ) qs;

  SELECT jsonb_object_agg('p' || priority, jsonb_build_object('count', pending_count, 'oldest_seconds', avg_age_seconds))
  INTO v_queue_by_priority
  FROM (
    SELECT 
      priority,
      COUNT(*) as pending_count,
      AVG(EXTRACT(EPOCH FROM (NOW() - created_at)))::INT as avg_age_seconds
    FROM public.sna_jobs
    WHERE status IN ('pending', 'scheduled')
    GROUP BY priority
  ) qs2;

  -- Health
  SELECT jsonb_object_agg(service, jsonb_build_object('ok', ok, 'latency_ms', latency_ms, 'checked_at', created_at))
  INTO v_health
  FROM (
    SELECT DISTINCT ON (service) service, ok, latency_ms, created_at
    FROM public.sna_healthchecks
    ORDER BY service, created_at DESC
  ) hl;

  -- Cache stats
  SELECT jsonb_build_object(
    'entries', COUNT(*),
    'total_hits', COALESCE(SUM(hit_count), 0),
    'saved_usd', COALESCE(SUM(saved_cost_usd), 0)
  )
  INTO v_cache_stats
  FROM public.sna_cache
  WHERE expires_at > NOW();

  -- Budgets
  SELECT jsonb_agg(jsonb_build_object(
    'scope', scope,
    'scope_id', scope_id,
    'period', period,
    'limit_usd', limit_usd,
    'spent_usd', spent_usd,
    'remaining_usd', GREATEST(0, limit_usd - spent_usd),
    'usage_pct', ROUND((spent_usd / NULLIF(limit_usd, 0) * 100), 2),
    'request_count', request_count
  ))
  INTO v_budgets
  FROM public.sna_budgets
  WHERE is_active AND period_end >= NOW();

  -- Build result
  v_result := jsonb_build_object(
    'period_hours', p_hours,
    'generated_at', NOW(),
    'jobs', jsonb_build_object(
      'by_status', COALESCE(v_jobs_by_status, '{}'::jsonb),
      'total', v_jobs_total,
      'success_rate', v_jobs_success_rate
    ),
    'tools', COALESCE(v_tools, '{}'::jsonb),
    'queue', jsonb_build_object(
      'total_pending', v_queue_total,
      'by_priority', COALESCE(v_queue_by_priority, '{}'::jsonb)
    ),
    'health', COALESCE(v_health, '{}'::jsonb),
    'cache', COALESCE(v_cache_stats, '{}'::jsonb),
    'budgets', COALESCE(v_budgets, '[]'::jsonb)
  );
  
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
AS $$
DECLARE
  v_deleted_jobs INT := 0;
  v_deleted_runs INT := 0;
  v_deleted_cache INT := 0;
  v_deleted_rate INT := 0;
  v_released_stuck INT := 0;
BEGIN
  -- Jobs completados/mortos
  DELETE FROM public.sna_jobs
  WHERE status IN ('succeeded', 'dead', 'cancelled')
    AND created_at < NOW() - (p_job_retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted_jobs = ROW_COUNT;
  
  -- Tool runs
  DELETE FROM public.sna_tool_runs
  WHERE created_at < NOW() - (p_tool_run_retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted_runs = ROW_COUNT;
  
  -- Cache expirado
  IF p_cache_cleanup THEN
    DELETE FROM public.sna_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS v_deleted_cache = ROW_COUNT;
  END IF;
  
  -- Rate limits antigos
  IF p_rate_limit_cleanup THEN
    DELETE FROM public.sna_rate_limits
    WHERE window_start < NOW() - INTERVAL '1 day';
    GET DIAGNOSTICS v_deleted_rate = ROW_COUNT;
  END IF;
  
  -- Liberar jobs travados (>30min)
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

-- Comentários
COMMENT ON FUNCTION public.sna_check_budget IS '🧠 SNA: Verificar orçamento com ação automática';
COMMENT ON FUNCTION public.sna_consume_budget IS '🧠 SNA: Consumir orçamento após uso';
COMMENT ON FUNCTION public.sna_check_feature IS '🧠 SNA: Verificar feature flag com rollout';
COMMENT ON FUNCTION public.sna_log_tool_run IS '🧠 SNA: Registrar execução de ferramenta';
COMMENT ON FUNCTION public.sna_cache_get IS '🧠 SNA: Obter valor do cache';
COMMENT ON FUNCTION public.sna_cache_set IS '🧠 SNA: Definir valor no cache';
COMMENT ON FUNCTION public.sna_get_metrics IS '🧠 SNA: Métricas completas do sistema';
COMMENT ON FUNCTION public.sna_cleanup IS '🧠 SNA: Limpeza automática de dados antigos';