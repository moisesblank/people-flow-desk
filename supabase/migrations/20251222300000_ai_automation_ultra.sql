-- ============================================================
-- 🧠 MATRIZ DE AUTOMAÇÃO IA ULTRA v3.0
-- SISTEMA NERVOSO AUTÔNOMO (SNA) - FORTALEZA DIGITAL
-- ============================================================
-- Objetivo: Automação robusta com IAs reais, integradas de ponta a ponta
-- Regra: NÃO quebrar o que existe, MELHORAR e ADICIONAR
-- ============================================================

-- ============================================================
-- PARTE 1: ENUMS E TIPOS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE ai_job_status AS ENUM ('pending', 'running', 'succeeded', 'failed', 'dead', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ai_job_priority AS ENUM ('p0_critical', 'p1_high', 'p2_normal', 'p3_low');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ai_provider AS ENUM (
    'gemini_flash', 'gemini_pro', 'gpt5', 'gpt5_mini', 'gpt5_nano',
    'perplexity', 'firecrawl', 'elevenlabs', 'whatsapp', 'email', 'internal'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- PARTE 2: TABELAS CORE DO SNA
-- ============================================================

-- 2.1 AI_JOBS: Fila persistente de jobs com idempotência
CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Identificação
  job_type TEXT NOT NULL, -- WF-TUTOR-01, WF-FC-01, WF-IMPORT-URL-01, etc.
  idempotency_key TEXT NOT NULL,
  
  -- Estado
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, succeeded, failed, dead, cancelled
  priority INT NOT NULL DEFAULT 2 CHECK (priority >= 0 AND priority <= 3), -- 0=P0 ... 3=P3
  
  -- Payload
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB,
  error JSONB,
  
  -- Retry
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Lock
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  
  -- Hierarquia
  parent_job_id UUID REFERENCES public.ai_jobs(id),
  
  -- Métricas
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_ms INT,
  
  -- Custo
  estimated_cost_usd NUMERIC(10, 6) DEFAULT 0,
  actual_cost_usd NUMERIC(10, 6) DEFAULT 0
);

-- Índices otimizados para ai_jobs
CREATE UNIQUE INDEX IF NOT EXISTS ai_jobs_idempotency_uq ON public.ai_jobs (job_type, idempotency_key);
CREATE INDEX IF NOT EXISTS ai_jobs_pending_idx ON public.ai_jobs (status, priority, run_after) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS ai_jobs_running_idx ON public.ai_jobs (status, locked_at) WHERE status = 'running';
CREATE INDEX IF NOT EXISTS ai_jobs_created_by_idx ON public.ai_jobs (created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_jobs_type_status_idx ON public.ai_jobs (job_type, status);

-- 2.2 AI_TOOL_RUNS: Auditoria de chamadas a ferramentas (LLMs, APIs, etc.)
CREATE TABLE IF NOT EXISTS public.ai_tool_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Referência ao job (opcional, pode ser chamada direta)
  job_id UUID REFERENCES public.ai_jobs(id),
  
  -- Identificação
  tool_name TEXT NOT NULL, -- gemini_flash, gpt5, firecrawl, perplexity, elevenlabs, whatsapp, email
  provider TEXT NOT NULL DEFAULT 'internal',
  
  -- Request/Response
  request JSONB NOT NULL,
  response JSONB,
  
  -- Status
  ok BOOLEAN NOT NULL DEFAULT FALSE,
  http_status INT,
  error JSONB,
  
  -- Métricas
  latency_ms INT,
  tokens_in INT,
  tokens_out INT,
  cost_usd NUMERIC(10, 6),
  
  -- Contexto
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  trace_id TEXT
);

CREATE INDEX IF NOT EXISTS ai_tool_runs_job_idx ON public.ai_tool_runs (job_id);
CREATE INDEX IF NOT EXISTS ai_tool_runs_tool_idx ON public.ai_tool_runs (tool_name, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_tool_runs_user_idx ON public.ai_tool_runs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_tool_runs_cost_idx ON public.ai_tool_runs (created_at DESC) WHERE cost_usd > 0;

-- 2.3 AI_BUDGETS: Controle de orçamento por escopo
CREATE TABLE IF NOT EXISTS public.ai_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Escopo
  scope TEXT NOT NULL CHECK (scope IN ('global', 'user', 'role', 'feature', 'tool')),
  scope_id TEXT NOT NULL, -- 'global', user_id, 'admin', 'tutor', 'gemini_flash'
  
  -- Período
  period TEXT NOT NULL CHECK (period IN ('day', 'week', 'month')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Limites
  limit_usd NUMERIC(10, 2) NOT NULL,
  spent_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  
  -- Alertas
  alert_threshold NUMERIC(3, 2) DEFAULT 0.8, -- 80%
  alert_sent BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_budgets_scope_period_uq ON public.ai_budgets (scope, scope_id, period, period_start);
CREATE INDEX IF NOT EXISTS ai_budgets_active_idx ON public.ai_budgets (is_active, period_end) WHERE is_active = TRUE;

-- 2.4 AI_HEALTHCHECKS: Prova de que integrações funcionam
CREATE TABLE IF NOT EXISTS public.ai_healthchecks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Serviço
  service TEXT NOT NULL, -- gemini_flash, gemini_pro, gpt5, perplexity, firecrawl, elevenlabs, whatsapp, email
  
  -- Status
  ok BOOLEAN NOT NULL,
  latency_ms INT,
  
  -- Detalhes
  response_preview TEXT, -- primeiros 200 chars da resposta
  error TEXT,
  details JSONB
);

CREATE INDEX IF NOT EXISTS ai_healthchecks_service_idx ON public.ai_healthchecks (service, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_healthchecks_ok_idx ON public.ai_healthchecks (ok, created_at DESC);

-- 2.5 AI_FEATURE_FLAGS: Liga/desliga funcionalidades
CREATE TABLE IF NOT EXISTS public.ai_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Identificação
  flag_key TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Estado
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Configuração
  config JSONB DEFAULT '{}'::jsonb,
  
  -- Rollout
  rollout_percentage INT DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  allowed_roles TEXT[] DEFAULT ARRAY['owner', 'admin'],
  
  -- Audit
  updated_by UUID REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_feature_flags_key_uq ON public.ai_feature_flags (flag_key);

-- 2.6 AI_RATE_LIMITS: Rate limiting específico para IA
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Identificador
  identifier TEXT NOT NULL, -- user_id ou IP
  endpoint TEXT NOT NULL, -- tutor, flashcards, import, etc.
  
  -- Contadores
  request_count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_minutes INT NOT NULL DEFAULT 1,
  
  -- Limites
  limit_per_window INT NOT NULL DEFAULT 10
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_rate_limits_uq ON public.ai_rate_limits (identifier, endpoint, window_start);
CREATE INDEX IF NOT EXISTS ai_rate_limits_cleanup_idx ON public.ai_rate_limits (window_start);

-- ============================================================
-- PARTE 3: TRIGGERS E FUNÇÕES AUXILIARES
-- ============================================================

-- 3.1 Trigger para updated_at
CREATE OR REPLACE FUNCTION update_ai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_ai_jobs_updated ON public.ai_jobs;
CREATE TRIGGER tr_ai_jobs_updated
  BEFORE UPDATE ON public.ai_jobs
  FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

DROP TRIGGER IF EXISTS tr_ai_budgets_updated ON public.ai_budgets;
CREATE TRIGGER tr_ai_budgets_updated
  BEFORE UPDATE ON public.ai_budgets
  FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

DROP TRIGGER IF EXISTS tr_ai_feature_flags_updated ON public.ai_feature_flags;
CREATE TRIGGER tr_ai_feature_flags_updated
  BEFORE UPDATE ON public.ai_feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

-- ============================================================
-- PARTE 4: FUNÇÕES CORE DO SNA
-- ============================================================

-- 4.1 Criar job com idempotência
CREATE OR REPLACE FUNCTION public.create_ai_job(
  p_job_type TEXT,
  p_idempotency_key TEXT,
  p_input JSONB DEFAULT '{}'::jsonb,
  p_priority INT DEFAULT 2,
  p_run_after TIMESTAMPTZ DEFAULT NOW(),
  p_max_attempts INT DEFAULT 5,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_id UUID;
  v_existing_id UUID;
BEGIN
  -- Verificar se já existe
  SELECT id INTO v_existing_id
  FROM public.ai_jobs
  WHERE job_type = p_job_type AND idempotency_key = p_idempotency_key;
  
  IF v_existing_id IS NOT NULL THEN
    -- Retorna o existente (idempotente)
    RETURN v_existing_id;
  END IF;
  
  -- Criar novo
  INSERT INTO public.ai_jobs (
    job_type, idempotency_key, input, priority, run_after, max_attempts, created_by
  ) VALUES (
    p_job_type, p_idempotency_key, p_input, p_priority, p_run_after, p_max_attempts, COALESCE(p_created_by, auth.uid())
  )
  RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$;

-- 4.2 Pegar próximo job para processar (com lock)
CREATE OR REPLACE FUNCTION public.claim_ai_job(
  p_worker_id TEXT,
  p_job_types TEXT[] DEFAULT NULL,
  p_limit INT DEFAULT 1
)
RETURNS SETOF public.ai_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH jobs_to_claim AS (
    SELECT id
    FROM public.ai_jobs
    WHERE status = 'pending'
      AND run_after <= NOW()
      AND (p_job_types IS NULL OR job_type = ANY(p_job_types))
    ORDER BY priority ASC, run_after ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.ai_jobs
  SET 
    status = 'running',
    locked_at = NOW(),
    locked_by = p_worker_id,
    started_at = NOW(),
    attempts = attempts + 1
  WHERE id IN (SELECT id FROM jobs_to_claim)
  RETURNING *;
END;
$$;

-- 4.3 Completar job com sucesso
CREATE OR REPLACE FUNCTION public.complete_ai_job(
  p_job_id UUID,
  p_output JSONB DEFAULT NULL,
  p_cost_usd NUMERIC DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
BEGIN
  SELECT started_at INTO v_started_at FROM public.ai_jobs WHERE id = p_job_id;
  
  UPDATE public.ai_jobs
  SET 
    status = 'succeeded',
    output = p_output,
    actual_cost_usd = p_cost_usd,
    completed_at = NOW(),
    processing_time_ms = EXTRACT(MILLISECONDS FROM (NOW() - v_started_at))::INT,
    locked_at = NULL,
    locked_by = NULL
  WHERE id = p_job_id AND status = 'running';
  
  RETURN FOUND;
END;
$$;

-- 4.4 Falhar job (com retry automático)
CREATE OR REPLACE FUNCTION public.fail_ai_job(
  p_job_id UUID,
  p_error JSONB DEFAULT NULL,
  p_retry_delay_seconds INT DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempts INT;
  v_max_attempts INT;
  v_new_status TEXT;
BEGIN
  SELECT attempts, max_attempts INTO v_attempts, v_max_attempts
  FROM public.ai_jobs WHERE id = p_job_id;
  
  IF v_attempts >= v_max_attempts THEN
    v_new_status := 'dead';
  ELSE
    v_new_status := 'pending';
  END IF;
  
  UPDATE public.ai_jobs
  SET 
    status = v_new_status,
    error = p_error,
    run_after = CASE WHEN v_new_status = 'pending' 
                     THEN NOW() + (p_retry_delay_seconds * POWER(2, v_attempts - 1)) * INTERVAL '1 second'
                     ELSE run_after END,
    completed_at = CASE WHEN v_new_status = 'dead' THEN NOW() ELSE NULL END,
    locked_at = NULL,
    locked_by = NULL
  WHERE id = p_job_id;
  
  RETURN FOUND;
END;
$$;

-- 4.5 Registrar chamada a ferramenta
CREATE OR REPLACE FUNCTION public.log_ai_tool_run(
  p_tool_name TEXT,
  p_request JSONB,
  p_response JSONB DEFAULT NULL,
  p_ok BOOLEAN DEFAULT FALSE,
  p_latency_ms INT DEFAULT NULL,
  p_cost_usd NUMERIC DEFAULT NULL,
  p_error JSONB DEFAULT NULL,
  p_job_id UUID DEFAULT NULL,
  p_tokens_in INT DEFAULT NULL,
  p_tokens_out INT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id UUID;
BEGIN
  INSERT INTO public.ai_tool_runs (
    tool_name, request, response, ok, latency_ms, cost_usd, error, job_id,
    tokens_in, tokens_out, user_id
  ) VALUES (
    p_tool_name, p_request, p_response, p_ok, p_latency_ms, p_cost_usd, p_error, p_job_id,
    p_tokens_in, p_tokens_out, auth.uid()
  )
  RETURNING id INTO v_run_id;
  
  -- Atualizar budget se houver custo
  IF p_cost_usd IS NOT NULL AND p_cost_usd > 0 THEN
    -- Budget global
    UPDATE public.ai_budgets
    SET spent_usd = spent_usd + p_cost_usd
    WHERE scope = 'global' AND scope_id = 'global'
      AND period_start <= CURRENT_DATE AND period_end >= CURRENT_DATE
      AND is_active = TRUE;
    
    -- Budget por ferramenta
    UPDATE public.ai_budgets
    SET spent_usd = spent_usd + p_cost_usd
    WHERE scope = 'tool' AND scope_id = p_tool_name
      AND period_start <= CURRENT_DATE AND period_end >= CURRENT_DATE
      AND is_active = TRUE;
  END IF;
  
  RETURN v_run_id;
END;
$$;

-- 4.6 Verificar rate limit
CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_limit_per_minute INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INT;
  v_allowed BOOLEAN;
BEGIN
  v_window_start := date_trunc('minute', NOW());
  
  -- Inserir ou incrementar
  INSERT INTO public.ai_rate_limits (identifier, endpoint, request_count, window_start, limit_per_window)
  VALUES (p_identifier, p_endpoint, 1, v_window_start, p_limit_per_minute)
  ON CONFLICT (identifier, endpoint, window_start) 
  DO UPDATE SET request_count = public.ai_rate_limits.request_count + 1
  RETURNING request_count INTO v_count;
  
  v_allowed := v_count <= p_limit_per_minute;
  
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'current', v_count,
    'limit', p_limit_per_minute,
    'reset_at', v_window_start + INTERVAL '1 minute'
  );
END;
$$;

-- 4.7 Verificar budget
CREATE OR REPLACE FUNCTION public.check_ai_budget(
  p_scope TEXT DEFAULT 'global',
  p_scope_id TEXT DEFAULT 'global'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_limit NUMERIC;
  v_spent NUMERIC;
  v_remaining NUMERIC;
  v_percentage NUMERIC;
  v_allowed BOOLEAN;
BEGIN
  SELECT limit_usd, spent_usd
  INTO v_limit, v_spent
  FROM public.ai_budgets
  WHERE scope = p_scope AND scope_id = p_scope_id
    AND period_start <= CURRENT_DATE AND period_end >= CURRENT_DATE
    AND is_active = TRUE
  ORDER BY period_start DESC
  LIMIT 1;
  
  IF v_limit IS NULL THEN
    -- Sem budget definido = permitido
    RETURN jsonb_build_object('allowed', true, 'no_budget', true);
  END IF;
  
  v_remaining := v_limit - v_spent;
  v_percentage := (v_spent / NULLIF(v_limit, 0)) * 100;
  v_allowed := v_remaining > 0;
  
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'limit_usd', v_limit,
    'spent_usd', v_spent,
    'remaining_usd', v_remaining,
    'percentage', ROUND(v_percentage, 2)
  );
END;
$$;

-- 4.8 Verificar feature flag
CREATE OR REPLACE FUNCTION public.check_ai_feature_flag(
  p_flag_key TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_is_enabled BOOLEAN;
  v_rollout INT;
  v_allowed_roles TEXT[];
  v_user_role TEXT;
BEGIN
  SELECT is_enabled, rollout_percentage, allowed_roles
  INTO v_is_enabled, v_rollout, v_allowed_roles
  FROM public.ai_feature_flags
  WHERE flag_key = p_flag_key;
  
  IF v_is_enabled IS NULL THEN
    -- Flag não existe = desabilitado por padrão
    RETURN FALSE;
  END IF;
  
  IF NOT v_is_enabled THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar role se user_id fornecido
  IF p_user_id IS NOT NULL AND array_length(v_allowed_roles, 1) > 0 THEN
    SELECT role INTO v_user_role
    FROM public.profiles
    WHERE id = p_user_id;
    
    IF v_user_role IS NULL OR NOT (v_user_role = ANY(v_allowed_roles)) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Rollout percentual
  IF v_rollout < 100 THEN
    -- Hash do user_id para consistência
    IF p_user_id IS NOT NULL THEN
      RETURN (abs(hashtext(p_user_id::TEXT)) % 100) < v_rollout;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 4.9 Registrar healthcheck
CREATE OR REPLACE FUNCTION public.record_ai_healthcheck(
  p_service TEXT,
  p_ok BOOLEAN,
  p_latency_ms INT DEFAULT NULL,
  p_response_preview TEXT DEFAULT NULL,
  p_error TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.ai_healthchecks (service, ok, latency_ms, response_preview, error, details)
  VALUES (p_service, p_ok, p_latency_ms, p_response_preview, p_error, p_details)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- 4.10 Obter métricas do SNA
CREATE OR REPLACE FUNCTION public.get_ai_metrics(
  p_hours INT DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH job_stats AS (
    SELECT 
      status,
      COUNT(*) as count,
      AVG(processing_time_ms) as avg_time,
      SUM(actual_cost_usd) as total_cost
    FROM public.ai_jobs
    WHERE created_at > NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY status
  ),
  tool_stats AS (
    SELECT 
      tool_name,
      COUNT(*) as calls,
      SUM(CASE WHEN ok THEN 1 ELSE 0 END) as success,
      AVG(latency_ms) as avg_latency,
      SUM(cost_usd) as total_cost
    FROM public.ai_tool_runs
    WHERE created_at > NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY tool_name
  ),
  queue_depth AS (
    SELECT 
      priority,
      COUNT(*) as pending
    FROM public.ai_jobs
    WHERE status = 'pending'
    GROUP BY priority
  ),
  health_latest AS (
    SELECT DISTINCT ON (service)
      service,
      ok,
      latency_ms,
      created_at
    FROM public.ai_healthchecks
    ORDER BY service, created_at DESC
  )
  SELECT jsonb_build_object(
    'period_hours', p_hours,
    'jobs', (SELECT jsonb_object_agg(status, jsonb_build_object('count', count, 'avg_time_ms', avg_time, 'cost_usd', total_cost)) FROM job_stats),
    'tools', (SELECT jsonb_object_agg(tool_name, jsonb_build_object('calls', calls, 'success_rate', (success::float / NULLIF(calls, 0)) * 100, 'avg_latency_ms', avg_latency, 'cost_usd', total_cost)) FROM tool_stats),
    'queue_depth', (SELECT jsonb_object_agg('p' || priority, pending) FROM queue_depth),
    'health', (SELECT jsonb_object_agg(service, jsonb_build_object('ok', ok, 'latency_ms', latency_ms, 'checked_at', created_at)) FROM health_latest),
    'budgets', (
      SELECT jsonb_agg(jsonb_build_object(
        'scope', scope,
        'scope_id', scope_id,
        'limit_usd', limit_usd,
        'spent_usd', spent_usd,
        'percentage', ROUND((spent_usd / NULLIF(limit_usd, 0)) * 100, 2)
      ))
      FROM public.ai_budgets
      WHERE is_active AND period_end >= CURRENT_DATE
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- ============================================================
-- PARTE 5: CLEANUP E MANUTENÇÃO
-- ============================================================

-- 5.1 Limpar jobs antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_ai_data(
  p_days_jobs INT DEFAULT 30,
  p_days_tool_runs INT DEFAULT 7,
  p_days_rate_limits INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_jobs INT;
  v_deleted_runs INT;
  v_deleted_limits INT;
BEGIN
  -- Jobs completados/mortos
  DELETE FROM public.ai_jobs
  WHERE status IN ('succeeded', 'dead', 'cancelled')
    AND created_at < NOW() - (p_days_jobs || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted_jobs = ROW_COUNT;
  
  -- Tool runs
  DELETE FROM public.ai_tool_runs
  WHERE created_at < NOW() - (p_days_tool_runs || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted_runs = ROW_COUNT;
  
  -- Rate limits expirados
  DELETE FROM public.ai_rate_limits
  WHERE window_start < NOW() - (p_days_rate_limits || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted_limits = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'deleted_jobs', v_deleted_jobs,
    'deleted_tool_runs', v_deleted_runs,
    'deleted_rate_limits', v_deleted_limits
  );
END;
$$;

-- 5.2 Liberar jobs travados
CREATE OR REPLACE FUNCTION public.release_stuck_ai_jobs(
  p_timeout_minutes INT DEFAULT 30
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_released INT;
BEGIN
  UPDATE public.ai_jobs
  SET 
    status = 'pending',
    locked_at = NULL,
    locked_by = NULL,
    run_after = NOW()
  WHERE status = 'running'
    AND locked_at < NOW() - (p_timeout_minutes || ' minutes')::INTERVAL;
  
  GET DIAGNOSTICS v_released = ROW_COUNT;
  RETURN v_released;
END;
$$;

-- ============================================================
-- PARTE 6: RLS POLICIES
-- ============================================================

ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tool_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_healthchecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar admin/owner
CREATE OR REPLACE FUNCTION public.is_ai_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role IN ('owner', 'admin', 'coordenacao');
END;
$$;

-- ai_jobs: usuário vê seus jobs, admin vê todos
DROP POLICY IF EXISTS "ai_jobs_select" ON public.ai_jobs;
CREATE POLICY "ai_jobs_select" ON public.ai_jobs
  FOR SELECT USING (created_by = auth.uid() OR public.is_ai_admin());

DROP POLICY IF EXISTS "ai_jobs_insert" ON public.ai_jobs;
CREATE POLICY "ai_jobs_insert" ON public.ai_jobs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "ai_jobs_update" ON public.ai_jobs;
CREATE POLICY "ai_jobs_update" ON public.ai_jobs
  FOR UPDATE USING (public.is_ai_admin());

-- ai_tool_runs: usuário vê seus, admin vê todos
DROP POLICY IF EXISTS "ai_tool_runs_select" ON public.ai_tool_runs;
CREATE POLICY "ai_tool_runs_select" ON public.ai_tool_runs
  FOR SELECT USING (user_id = auth.uid() OR public.is_ai_admin());

DROP POLICY IF EXISTS "ai_tool_runs_insert" ON public.ai_tool_runs;
CREATE POLICY "ai_tool_runs_insert" ON public.ai_tool_runs
  FOR INSERT WITH CHECK (TRUE); -- Service role insere

-- ai_budgets: apenas admin
DROP POLICY IF EXISTS "ai_budgets_all" ON public.ai_budgets;
CREATE POLICY "ai_budgets_all" ON public.ai_budgets
  FOR ALL USING (public.is_ai_admin());

-- ai_healthchecks: leitura para admin
DROP POLICY IF EXISTS "ai_healthchecks_select" ON public.ai_healthchecks;
CREATE POLICY "ai_healthchecks_select" ON public.ai_healthchecks
  FOR SELECT USING (public.is_ai_admin());

DROP POLICY IF EXISTS "ai_healthchecks_insert" ON public.ai_healthchecks;
CREATE POLICY "ai_healthchecks_insert" ON public.ai_healthchecks
  FOR INSERT WITH CHECK (TRUE); -- Service role insere

-- ai_feature_flags: admin gerencia
DROP POLICY IF EXISTS "ai_feature_flags_select" ON public.ai_feature_flags;
CREATE POLICY "ai_feature_flags_select" ON public.ai_feature_flags
  FOR SELECT USING (TRUE); -- Todos podem ler flags

DROP POLICY IF EXISTS "ai_feature_flags_manage" ON public.ai_feature_flags;
CREATE POLICY "ai_feature_flags_manage" ON public.ai_feature_flags
  FOR ALL USING (public.is_ai_admin());

-- ai_rate_limits: service role
DROP POLICY IF EXISTS "ai_rate_limits_all" ON public.ai_rate_limits;
CREATE POLICY "ai_rate_limits_all" ON public.ai_rate_limits
  FOR ALL USING (TRUE); -- Service role gerencia

-- ============================================================
-- PARTE 7: DADOS INICIAIS
-- ============================================================

-- Feature flags padrão
INSERT INTO public.ai_feature_flags (flag_key, description, is_enabled, allowed_roles) VALUES
  ('enable_tutor', 'IA Tutor para alunos', TRUE, ARRAY['owner', 'admin', 'beta']),
  ('enable_flashcards_generation', 'Geração de flashcards com IA', TRUE, ARRAY['owner', 'admin', 'beta']),
  ('enable_mindmap_generation', 'Geração de mapas mentais', TRUE, ARRAY['owner', 'admin', 'beta']),
  ('enable_cronograma_generation', 'Geração de cronogramas', TRUE, ARRAY['owner', 'admin', 'beta']),
  ('enable_question_importer', 'Importador de questões via URL/PDF', TRUE, ARRAY['owner', 'admin']),
  ('enable_live_summary', 'Resumo de perguntas em lives', TRUE, ARRAY['owner', 'admin']),
  ('enable_whatsapp_automations', 'Automações WhatsApp', TRUE, ARRAY['owner', 'admin']),
  ('enable_email_automations', 'Automações de email', TRUE, ARRAY['owner', 'admin']),
  ('enable_voice_narration', 'Narração com ElevenLabs', FALSE, ARRAY['owner']),
  ('enable_perplexity_web', 'Respostas com fontes web', FALSE, ARRAY['owner', 'admin'])
ON CONFLICT (flag_key) DO UPDATE SET updated_at = NOW();

-- Budgets iniciais (exemplo)
INSERT INTO public.ai_budgets (scope, scope_id, period, period_start, period_end, limit_usd) VALUES
  ('global', 'global', 'month', date_trunc('month', CURRENT_DATE)::DATE, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE, 100.00),
  ('tool', 'gpt5', 'month', date_trunc('month', CURRENT_DATE)::DATE, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE, 50.00),
  ('tool', 'gemini_pro', 'month', date_trunc('month', CURRENT_DATE)::DATE, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE, 30.00)
ON CONFLICT (scope, scope_id, period, period_start) DO NOTHING;

-- ============================================================
-- PARTE 8: REALTIME
-- ============================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_jobs;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_healthchecks;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE public.ai_jobs IS 'Fila persistente de jobs de IA com idempotência, retry e DLQ';
COMMENT ON TABLE public.ai_tool_runs IS 'Auditoria completa de todas as chamadas a ferramentas de IA';
COMMENT ON TABLE public.ai_budgets IS 'Controle de orçamento por escopo (global, user, role, feature, tool)';
COMMENT ON TABLE public.ai_healthchecks IS 'Histórico de healthchecks de serviços de IA';
COMMENT ON TABLE public.ai_feature_flags IS 'Feature flags para controle granular de funcionalidades';
COMMENT ON TABLE public.ai_rate_limits IS 'Rate limiting específico para endpoints de IA';

COMMENT ON FUNCTION public.create_ai_job IS 'Cria job com idempotência (retorna existente se já houver)';
COMMENT ON FUNCTION public.claim_ai_job IS 'Worker pega próximo job com SKIP LOCKED';
COMMENT ON FUNCTION public.complete_ai_job IS 'Marca job como sucesso';
COMMENT ON FUNCTION public.fail_ai_job IS 'Marca job como falha (com retry exponencial automático)';
COMMENT ON FUNCTION public.check_ai_rate_limit IS 'Verifica e incrementa rate limit';
COMMENT ON FUNCTION public.check_ai_budget IS 'Verifica orçamento disponível';
COMMENT ON FUNCTION public.get_ai_metrics IS 'Obtém métricas completas do SNA';
