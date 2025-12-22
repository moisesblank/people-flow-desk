-- ============================================================
-- PARTE 3: TRIGGERS AUTOMÁTICOS SNA
-- ============================================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.sna_update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_sna_jobs_updated ON public.sna_jobs;
CREATE TRIGGER tr_sna_jobs_updated
  BEFORE UPDATE ON public.sna_jobs
  FOR EACH ROW EXECUTE FUNCTION public.sna_update_timestamp();

DROP TRIGGER IF EXISTS tr_sna_budgets_updated ON public.sna_budgets;
CREATE TRIGGER tr_sna_budgets_updated
  BEFORE UPDATE ON public.sna_budgets
  FOR EACH ROW EXECUTE FUNCTION public.sna_update_timestamp();

DROP TRIGGER IF EXISTS tr_sna_flags_updated ON public.sna_feature_flags;
CREATE TRIGGER tr_sna_flags_updated
  BEFORE UPDATE ON public.sna_feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.sna_update_timestamp();

DROP TRIGGER IF EXISTS tr_sna_conv_updated ON public.sna_conversations;
CREATE TRIGGER tr_sna_conv_updated
  BEFORE UPDATE ON public.sna_conversations
  FOR EACH ROW EXECUTE FUNCTION public.sna_update_timestamp();

-- Trigger para atualizar conversation stats
CREATE OR REPLACE FUNCTION public.sna_update_conversation_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sna_conversations
  SET 
    message_count = message_count + 1,
    total_tokens = total_tokens + COALESCE(NEW.tokens, 0),
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_sna_message_stats ON public.sna_messages;
CREATE TRIGGER tr_sna_message_stats
  AFTER INSERT ON public.sna_messages
  FOR EACH ROW EXECUTE FUNCTION public.sna_update_conversation_stats();

-- ============================================================
-- PARTE 4: FUNÇÕES CORE DO SNA
-- ============================================================

-- 4.1 Criar job com validação completa
CREATE OR REPLACE FUNCTION public.sna_create_job(
  p_job_type TEXT,
  p_idempotency_key TEXT,
  p_input JSONB DEFAULT '{}'::jsonb,
  p_priority INT DEFAULT 3,
  p_run_after TIMESTAMPTZ DEFAULT NOW(),
  p_deadline TIMESTAMPTZ DEFAULT NULL,
  p_max_attempts INT DEFAULT 5,
  p_timeout_seconds INT DEFAULT 300,
  p_parent_job_id UUID DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id UUID;
  v_existing RECORD;
  v_root_job_id UUID;
  v_step INT;
BEGIN
  -- Verificar se já existe
  SELECT id, status INTO v_existing
  FROM public.sna_jobs
  WHERE job_type = p_job_type AND idempotency_key = p_idempotency_key;
  
  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'job_id', v_existing.id,
      'status', v_existing.status,
      'is_new', false
    );
  END IF;
  
  -- Calcular hierarquia
  IF p_parent_job_id IS NOT NULL THEN
    SELECT root_job_id, step_number INTO v_root_job_id, v_step
    FROM public.sna_jobs WHERE id = p_parent_job_id;
    
    v_root_job_id := COALESCE(v_root_job_id, p_parent_job_id);
    v_step := COALESCE(v_step, 0) + 1;
  END IF;
  
  -- Criar job
  INSERT INTO public.sna_jobs (
    job_type, idempotency_key, input, priority, run_after, deadline,
    max_attempts, timeout_seconds, parent_job_id, root_job_id, step_number,
    tags, metadata, created_by
  ) VALUES (
    p_job_type, p_idempotency_key, p_input, p_priority, p_run_after, p_deadline,
    p_max_attempts, p_timeout_seconds, p_parent_job_id, v_root_job_id, COALESCE(v_step, 1),
    p_tags, p_metadata, auth.uid()
  )
  RETURNING id INTO v_job_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'job_id', v_job_id,
    'status', 'pending',
    'is_new', true
  );
END;
$$;

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
SET search_path = public
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
SET search_path = public
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
SET search_path = public
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
  
  -- Cap em 1 hora
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

-- 4.5 Rate limit avançado SNA
CREATE OR REPLACE FUNCTION public.sna_check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_cost NUMERIC DEFAULT 0,
  p_tokens INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_config RECORD;
  v_current RECORD;
  v_allowed BOOLEAN := true;
  v_reason TEXT;
BEGIN
  v_window_start := date_trunc('minute', NOW());
  
  -- Verificar penalidade ativa
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
  
  -- Inserir ou atualizar
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
  
  -- Verificar limites
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

-- Comentários
COMMENT ON FUNCTION public.sna_create_job IS '🧠 SNA: Criar job com idempotência e hierarquia';
COMMENT ON FUNCTION public.sna_claim_jobs IS '🧠 SNA: Claim jobs com SKIP LOCKED para concorrência';
COMMENT ON FUNCTION public.sna_complete_job IS '🧠 SNA: Completar job com métricas';
COMMENT ON FUNCTION public.sna_fail_job IS '🧠 SNA: Falhar job com retry inteligente';
COMMENT ON FUNCTION public.sna_check_rate_limit IS '🧠 SNA: Rate limit avançado multi-dimensional';