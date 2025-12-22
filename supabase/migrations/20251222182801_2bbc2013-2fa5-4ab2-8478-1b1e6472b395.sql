-- ============================================================
-- SNA OMEGA v5.0 - PARTE 4: Funções Core de Jobs e Rate Limit
-- ============================================================

-- 4.2 Claim jobs com SKIP LOCKED otimizado
CREATE OR REPLACE FUNCTION public.sna_claim_jobs(
  p_worker_id TEXT,
  p_job_types TEXT[] DEFAULT NULL,
  p_max_priority INT DEFAULT 5,
  p_limit INT DEFAULT 5
)
RETURNS SETOF public.sna_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_lock_token UUID := gen_random_uuid();
BEGIN
  RETURN QUERY
  WITH jobs_to_claim AS (
    SELECT id
    FROM public.sna_jobs
    WHERE status IN ('pending', 'scheduled')
      AND run_after <= NOW()
      AND (deadline IS NULL OR deadline > NOW())
      AND priority <= p_max_priority
      AND (p_job_types IS NULL OR job_type = ANY(p_job_types))
    ORDER BY priority ASC, run_after ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.sna_jobs j
  SET 
    status = 'running',
    locked_at = NOW(),
    locked_by = p_worker_id,
    lock_token = v_lock_token,
    started_at = COALESCE(started_at, NOW()),
    queue_time_ms = EXTRACT(MILLISECONDS FROM (NOW() - created_at))::INT,
    attempts = attempts + 1
  FROM jobs_to_claim jtc
  WHERE j.id = jtc.id
  RETURNING j.*;
END;
$$;

-- 4.3 Completar job com métricas
CREATE OR REPLACE FUNCTION public.sna_complete_job(
  p_job_id UUID,
  p_output JSONB DEFAULT NULL,
  p_cost_usd NUMERIC DEFAULT 0,
  p_tokens_in INT DEFAULT 0,
  p_tokens_out INT DEFAULT 0,
  p_result_summary TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
  v_processing_time INT;
BEGIN
  SELECT started_at INTO v_started_at FROM public.sna_jobs WHERE id = p_job_id;
  v_processing_time := EXTRACT(MILLISECONDS FROM (NOW() - v_started_at))::INT;
  
  UPDATE public.sna_jobs
  SET 
    status = 'succeeded',
    success = true,
    output = p_output,
    actual_cost_usd = p_cost_usd,
    tokens_in = p_tokens_in,
    tokens_out = p_tokens_out,
    result_summary = p_result_summary,
    completed_at = NOW(),
    processing_time_ms = v_processing_time,
    locked_at = NULL,
    locked_by = NULL,
    lock_token = NULL
  WHERE id = p_job_id AND status = 'running';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job not found or not running');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'processing_time_ms', v_processing_time,
    'cost_usd', p_cost_usd
  );
END;
$$;

-- 4.4 Falhar job com retry inteligente
CREATE OR REPLACE FUNCTION public.sna_fail_job(
  p_job_id UUID,
  p_error JSONB DEFAULT NULL,
  p_retry_delay_override INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_job RECORD;
  v_new_status TEXT;
  v_next_run TIMESTAMPTZ;
  v_delay_seconds INT;
BEGIN
  SELECT * INTO v_job FROM public.sna_jobs WHERE id = p_job_id;
  
  IF v_job IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job not found');
  END IF;
  
  -- Calcular delay baseado na estratégia
  IF p_retry_delay_override IS NOT NULL THEN
    v_delay_seconds := p_retry_delay_override;
  ELSIF v_job.retry_strategy = 'exponential' THEN
    v_delay_seconds := v_job.base_delay_seconds * POWER(2, v_job.attempts - 1);
  ELSIF v_job.retry_strategy = 'fibonacci' THEN
    v_delay_seconds := v_job.base_delay_seconds * (
      CASE v_job.attempts
        WHEN 1 THEN 1 WHEN 2 THEN 1 WHEN 3 THEN 2 WHEN 4 THEN 3 WHEN 5 THEN 5
        ELSE 8
      END
    );
  ELSE
    v_delay_seconds := v_job.base_delay_seconds * v_job.attempts;
  END IF;
  
  v_delay_seconds := LEAST(v_delay_seconds, 3600);
  
  IF v_job.attempts >= v_job.max_attempts THEN
    v_new_status := 'dead';
    v_next_run := NULL;
  ELSE
    v_new_status := 'pending';
    v_next_run := NOW() + (v_delay_seconds || ' seconds')::INTERVAL;
  END IF;
  
  UPDATE public.sna_jobs
  SET 
    status = v_new_status,
    success = CASE WHEN v_new_status = 'dead' THEN false ELSE NULL END,
    error = p_error,
    run_after = COALESCE(v_next_run, run_after),
    completed_at = CASE WHEN v_new_status = 'dead' THEN NOW() ELSE NULL END,
    locked_at = NULL,
    locked_by = NULL,
    lock_token = NULL
  WHERE id = p_job_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'new_status', v_new_status,
    'retry_in_seconds', v_delay_seconds,
    'attempts_remaining', GREATEST(0, v_job.max_attempts - v_job.attempts)
  );
END;
$$;

-- 4.5 Rate limit avançado
CREATE OR REPLACE FUNCTION public.sna_check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_cost NUMERIC DEFAULT 0,
  p_tokens INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_config RECORD;
  v_current RECORD;
  v_allowed BOOLEAN := true;
  v_reason TEXT;
BEGIN
  v_window_start := date_trunc('minute', NOW());
  
  SELECT penalty_until, penalty_reason INTO v_config
  FROM public.sna_rate_limits
  WHERE identifier = p_identifier AND endpoint = p_endpoint
    AND penalty_until IS NOT NULL AND penalty_until > NOW()
  LIMIT 1;
  
  IF v_config.penalty_until IS NOT NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'penalty_active',
      'penalty_until', v_config.penalty_until,
      'penalty_reason', v_config.penalty_reason
    );
  END IF;
  
  INSERT INTO public.sna_rate_limits (
    identifier, endpoint, window_start, request_count, token_count, cost_usd
  ) VALUES (
    p_identifier, p_endpoint, v_window_start, 1, p_tokens, p_cost
  )
  ON CONFLICT (identifier, endpoint, window_start) 
  DO UPDATE SET 
    request_count = sna_rate_limits.request_count + 1,
    token_count = sna_rate_limits.token_count + p_tokens,
    cost_usd = sna_rate_limits.cost_usd + p_cost,
    last_request_at = NOW()
  RETURNING * INTO v_current;
  
  IF v_current.request_count > v_current.max_requests THEN
    v_allowed := false;
    v_reason := 'request_limit_exceeded';
  ELSIF v_current.max_tokens IS NOT NULL AND v_current.token_count > v_current.max_tokens THEN
    v_allowed := false;
    v_reason := 'token_limit_exceeded';
  ELSIF v_current.max_cost_usd IS NOT NULL AND v_current.cost_usd > v_current.max_cost_usd THEN
    v_allowed := false;
    v_reason := 'cost_limit_exceeded';
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'reason', COALESCE(v_reason, 'ok'),
    'current_requests', v_current.request_count,
    'max_requests', v_current.max_requests,
    'current_tokens', v_current.token_count,
    'current_cost', v_current.cost_usd,
    'reset_at', v_window_start + INTERVAL '1 minute'
  );
END;
$$;

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
SET search_path = 'public'
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

-- Comentários
COMMENT ON FUNCTION public.sna_claim_jobs IS '🧠 SNA: Reservar jobs para worker com SKIP LOCKED';
COMMENT ON FUNCTION public.sna_complete_job IS '🧠 SNA: Marcar job como sucesso com métricas';
COMMENT ON FUNCTION public.sna_fail_job IS '🧠 SNA: Marcar job como falha com retry inteligente';
COMMENT ON FUNCTION public.sna_check_rate_limit IS '🧠 SNA: Verificar rate limit multi-dimensional';
COMMENT ON FUNCTION public.sna_check_budget IS '🧠 SNA: Verificar orçamento com ações automáticas';