-- ============================================================
-- 🧠 SISTEMA NERVOSO AUTÔNOMO (SNA) OMEGA v5.0
-- FORTALEZA DIGITAL — AUTOMAÇÃO IA NÍVEL 2300
-- ============================================================
-- Autor: MESTRE PHD
-- Data: 2024-12-22
-- Capacidade: 5.000+ usuários simultâneos
-- ============================================================

-- ============================================================
-- PARTE 1: EXTENSÕES E TIPOS AVANÇADOS
-- ============================================================

-- Garantir extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums avançados
DO $$ BEGIN
  CREATE TYPE sna_job_status AS ENUM (
    'pending',      -- Aguardando processamento
    'scheduled',    -- Agendado para futuro
    'running',      -- Em execução
    'succeeded',    -- Sucesso
    'failed',       -- Falhou (retry possível)
    'dead',         -- Morto (sem retry)
    'cancelled',    -- Cancelado
    'paused'        -- Pausado
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sna_priority AS ENUM ('p0_critical', 'p1_urgent', 'p2_high', 'p3_normal', 'p4_low', 'p5_batch');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sna_provider AS ENUM (
    'gemini_flash',     -- Rápido, barato
    'gemini_pro',       -- Robusto
    'gpt5',             -- Crítico, máxima qualidade
    'gpt5_mini',        -- Balanceado
    'gpt5_nano',        -- Ultra rápido
    'claude_opus',      -- Raciocínio complexo
    'perplexity',       -- Pesquisa web
    'firecrawl',        -- Extração
    'elevenlabs',       -- Voz
    'whisper',          -- Transcrição
    'dall_e',           -- Imagens
    'internal'          -- Interno
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sna_agent_role AS ENUM (
    'router',           -- Roteador TRAMON
    'tutor',            -- Tutor IA
    'curator',          -- Curador de conteúdo
    'moderator',        -- Moderador de chat
    'marketing',        -- Marketing
    'operations',       -- Operações
    'financial',        -- Financeiro
    'support'           -- Suporte
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- PARTE 2: TABELAS CORE DO SNA OMEGA
-- ============================================================

-- 2.1 SNA_JOBS: Fila de jobs com tudo
CREATE TABLE IF NOT EXISTS public.sna_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ownership
  created_by UUID REFERENCES auth.users(id),
  tenant_id TEXT DEFAULT 'default',
  
  -- Identificação única
  job_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  correlation_id UUID DEFAULT gen_random_uuid(),
  
  -- Estado
  status TEXT NOT NULL DEFAULT 'pending',
  priority INT NOT NULL DEFAULT 3 CHECK (priority >= 0 AND priority <= 5),
  
  -- Payload
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB,
  error JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Retry avançado
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  retry_strategy TEXT DEFAULT 'exponential', -- linear, exponential, fibonacci
  base_delay_seconds INT DEFAULT 30,
  
  -- Scheduling
  run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline TIMESTAMPTZ,
  timeout_seconds INT DEFAULT 300,
  
  -- Lock
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  lock_token UUID,
  
  -- Hierarquia
  parent_job_id UUID REFERENCES public.sna_jobs(id),
  root_job_id UUID REFERENCES public.sna_jobs(id),
  step_number INT DEFAULT 1,
  total_steps INT DEFAULT 1,
  
  -- Métricas
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_ms INT,
  queue_time_ms INT,
  
  -- Custo
  provider TEXT,
  model TEXT,
  tokens_in INT DEFAULT 0,
  tokens_out INT DEFAULT 0,
  estimated_cost_usd NUMERIC(12, 8) DEFAULT 0,
  actual_cost_usd NUMERIC(12, 8) DEFAULT 0,
  
  -- Tags para queries
  tags TEXT[] DEFAULT '{}',
  
  -- Resultado simplificado para queries rápidas
  success BOOLEAN,
  result_summary TEXT
);

-- Índices otimizados para alta concorrência
CREATE UNIQUE INDEX IF NOT EXISTS sna_jobs_idempotency_uq 
  ON public.sna_jobs (job_type, idempotency_key);

CREATE INDEX IF NOT EXISTS sna_jobs_queue_idx 
  ON public.sna_jobs (status, priority, run_after) 
  WHERE status IN ('pending', 'scheduled');

CREATE INDEX IF NOT EXISTS sna_jobs_running_idx 
  ON public.sna_jobs (status, locked_at) 
  WHERE status = 'running';

CREATE INDEX IF NOT EXISTS sna_jobs_user_idx 
  ON public.sna_jobs (created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS sna_jobs_correlation_idx 
  ON public.sna_jobs (correlation_id);

CREATE INDEX IF NOT EXISTS sna_jobs_parent_idx 
  ON public.sna_jobs (parent_job_id) 
  WHERE parent_job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS sna_jobs_tags_idx 
  ON public.sna_jobs USING GIN (tags);

CREATE INDEX IF NOT EXISTS sna_jobs_type_status_idx 
  ON public.sna_jobs (job_type, status, created_at DESC);

-- 2.2 SNA_TOOL_RUNS: Auditoria detalhada
CREATE TABLE IF NOT EXISTS public.sna_tool_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Referências
  job_id UUID REFERENCES public.sna_jobs(id) ON DELETE SET NULL,
  correlation_id UUID,
  trace_id TEXT,
  span_id TEXT,
  
  -- Identificação
  tool_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  operation TEXT DEFAULT 'completion',
  
  -- Request/Response (compactados)
  request_hash TEXT,
  request_summary JSONB,
  response_summary JSONB,
  
  -- Status
  ok BOOLEAN NOT NULL DEFAULT FALSE,
  http_status INT,
  error_code TEXT,
  error_message TEXT,
  
  -- Métricas
  latency_ms INT,
  ttfb_ms INT,
  tokens_in INT,
  tokens_out INT,
  tokens_cached INT DEFAULT 0,
  
  -- Custo calculado
  cost_usd NUMERIC(12, 8),
  
  -- Contexto
  user_id UUID REFERENCES auth.users(id),
  user_role TEXT,
  endpoint TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Cache
  cache_hit BOOLEAN DEFAULT FALSE,
  cache_key TEXT
);

CREATE INDEX IF NOT EXISTS sna_tool_runs_job_idx ON public.sna_tool_runs (job_id);
CREATE INDEX IF NOT EXISTS sna_tool_runs_correlation_idx ON public.sna_tool_runs (correlation_id);
CREATE INDEX IF NOT EXISTS sna_tool_runs_tool_time_idx ON public.sna_tool_runs (tool_name, created_at DESC);
CREATE INDEX IF NOT EXISTS sna_tool_runs_user_idx ON public.sna_tool_runs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sna_tool_runs_cost_idx ON public.sna_tool_runs (created_at DESC) WHERE cost_usd > 0;

-- 2.3 SNA_BUDGETS: Orçamento multi-dimensional
CREATE TABLE IF NOT EXISTS public.sna_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Escopo
  scope TEXT NOT NULL CHECK (scope IN ('global', 'tenant', 'user', 'role', 'feature', 'tool', 'workflow')),
  scope_id TEXT NOT NULL,
  
  -- Período
  period TEXT NOT NULL CHECK (period IN ('hour', 'day', 'week', 'month', 'quarter', 'year')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Limites
  limit_usd NUMERIC(12, 2) NOT NULL,
  limit_requests INT,
  limit_tokens INT,
  
  -- Uso atual
  spent_usd NUMERIC(12, 8) NOT NULL DEFAULT 0,
  request_count INT NOT NULL DEFAULT 0,
  token_count INT NOT NULL DEFAULT 0,
  
  -- Alertas
  warn_threshold NUMERIC(3, 2) DEFAULT 0.7,
  critical_threshold NUMERIC(3, 2) DEFAULT 0.9,
  warn_sent_at TIMESTAMPTZ,
  critical_sent_at TIMESTAMPTZ,
  
  -- Ações automáticas
  action_on_limit TEXT DEFAULT 'block', -- block, throttle, notify, degrade
  throttle_factor NUMERIC(3, 2) DEFAULT 0.5,
  
  -- Estado
  is_active BOOLEAN DEFAULT TRUE,
  is_soft_limit BOOLEAN DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS sna_budgets_scope_period_uq 
  ON public.sna_budgets (scope, scope_id, period, period_start);
CREATE INDEX IF NOT EXISTS sna_budgets_active_idx 
  ON public.sna_budgets (is_active, period_end) WHERE is_active = TRUE;

-- 2.4 SNA_HEALTHCHECKS: Saúde com histórico
CREATE TABLE IF NOT EXISTS public.sna_healthchecks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Serviço
  service TEXT NOT NULL,
  endpoint TEXT,
  region TEXT DEFAULT 'sa-east-1',
  
  -- Status
  ok BOOLEAN NOT NULL,
  status_code INT,
  
  -- Métricas
  latency_ms INT,
  throughput_rps NUMERIC,
  error_rate NUMERIC,
  
  -- Detalhes
  response_preview TEXT,
  error_message TEXT,
  capabilities JSONB,
  
  -- Comparação
  previous_ok BOOLEAN,
  status_changed BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS sna_health_service_idx 
  ON public.sna_healthchecks (service, created_at DESC);
CREATE INDEX IF NOT EXISTS sna_health_status_idx 
  ON public.sna_healthchecks (ok, created_at DESC);

-- 2.5 SNA_FEATURE_FLAGS: Controle avançado
CREATE TABLE IF NOT EXISTS public.sna_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Identificação
  flag_key TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT,
  
  -- Estado
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Rollout
  rollout_percentage INT DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  rollout_strategy TEXT DEFAULT 'percentage', -- percentage, user_list, segment
  
  -- Segmentação
  allowed_roles TEXT[] DEFAULT ARRAY['owner', 'admin'],
  allowed_users UUID[],
  blocked_users UUID[],
  conditions JSONB DEFAULT '{}'::jsonb,
  
  -- Configuração
  config JSONB DEFAULT '{}'::jsonb,
  default_value JSONB,
  
  -- Audit
  updated_by UUID REFERENCES auth.users(id),
  change_log JSONB[] DEFAULT '{}'::jsonb[]
);

CREATE UNIQUE INDEX IF NOT EXISTS sna_flags_key_uq ON public.sna_feature_flags (flag_key);
CREATE INDEX IF NOT EXISTS sna_flags_category_idx ON public.sna_feature_flags (category);

-- 2.6 SNA_RATE_LIMITS: Rate limiting avançado
CREATE TABLE IF NOT EXISTS public.sna_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  identifier TEXT NOT NULL,
  identifier_type TEXT DEFAULT 'user_id', -- user_id, ip, api_key, session
  endpoint TEXT NOT NULL,
  
  -- Janela
  window_start TIMESTAMPTZ NOT NULL,
  window_size_seconds INT NOT NULL DEFAULT 60,
  
  -- Contadores
  request_count INT NOT NULL DEFAULT 1,
  token_count INT NOT NULL DEFAULT 0,
  cost_usd NUMERIC(12, 8) NOT NULL DEFAULT 0,
  
  -- Limites
  max_requests INT NOT NULL DEFAULT 60,
  max_tokens INT,
  max_cost_usd NUMERIC(12, 8),
  
  -- Penalidades
  penalty_until TIMESTAMPTZ,
  penalty_reason TEXT,
  
  -- Meta
  last_request_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS sna_rate_window_uq 
  ON public.sna_rate_limits (identifier, endpoint, window_start);
CREATE INDEX IF NOT EXISTS sna_rate_cleanup_idx 
  ON public.sna_rate_limits (window_start);
CREATE INDEX IF NOT EXISTS sna_rate_penalty_idx 
  ON public.sna_rate_limits (penalty_until) WHERE penalty_until IS NOT NULL;

-- 2.7 SNA_CACHE: Cache de respostas
CREATE TABLE IF NOT EXISTS public.sna_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Chave
  cache_key TEXT UNIQUE NOT NULL,
  cache_type TEXT DEFAULT 'response', -- response, embedding, context
  
  -- Valor
  cached_value JSONB NOT NULL,
  compressed BOOLEAN DEFAULT FALSE,
  
  -- TTL
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Stats
  hit_count INT DEFAULT 0,
  last_hit_at TIMESTAMPTZ,
  
  -- Custo economizado
  original_cost_usd NUMERIC(12, 8) DEFAULT 0,
  saved_cost_usd NUMERIC(12, 8) DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS sna_cache_key_uq ON public.sna_cache (cache_key);
CREATE INDEX IF NOT EXISTS sna_cache_expires_idx ON public.sna_cache (expires_at);
CREATE INDEX IF NOT EXISTS sna_cache_type_idx ON public.sna_cache (cache_type, created_at DESC);

-- 2.8 SNA_CONVERSATIONS: Threads de conversação
CREATE TABLE IF NOT EXISTS public.sna_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Contexto
  agent_type TEXT NOT NULL DEFAULT 'tutor',
  lesson_id UUID,
  course_id UUID,
  
  -- Estado
  title TEXT,
  status TEXT DEFAULT 'active', -- active, archived, deleted
  
  -- Métricas
  message_count INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  total_cost_usd NUMERIC(12, 8) DEFAULT 0,
  
  -- Última atividade
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT
);

CREATE INDEX IF NOT EXISTS sna_conv_user_idx ON public.sna_conversations (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS sna_conv_agent_idx ON public.sna_conversations (agent_type, status);

-- 2.9 SNA_MESSAGES: Mensagens de conversação
CREATE TABLE IF NOT EXISTS public.sna_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Referência
  conversation_id UUID NOT NULL REFERENCES public.sna_conversations(id) ON DELETE CASCADE,
  
  -- Mensagem
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'function')),
  content TEXT NOT NULL,
  
  -- Metadados
  tokens INT,
  model TEXT,
  latency_ms INT,
  
  -- Feedback
  rating INT CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  
  -- Ações geradas
  actions JSONB,
  citations JSONB
);

CREATE INDEX IF NOT EXISTS sna_msg_conv_idx ON public.sna_messages (conversation_id, created_at);

-- 2.10 SNA_EMBEDDINGS: Vetores para RAG
CREATE TABLE IF NOT EXISTS public.sna_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Fonte
  source_type TEXT NOT NULL, -- lesson, module, question, flashcard
  source_id UUID NOT NULL,
  chunk_index INT DEFAULT 0,
  
  -- Conteúdo
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  
  -- Embedding (1536 dimensões para OpenAI)
  embedding VECTOR(1536),
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Tags para filtro
  tags TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS sna_embed_source_idx ON public.sna_embeddings (source_type, source_id);
CREATE INDEX IF NOT EXISTS sna_embed_hash_idx ON public.sna_embeddings (content_hash);

-- ============================================================
-- PARTE 3: TRIGGERS AUTOMÁTICOS
-- ============================================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION sna_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sna_jobs_updated ON public.sna_jobs;
CREATE TRIGGER tr_sna_jobs_updated
  BEFORE UPDATE ON public.sna_jobs
  FOR EACH ROW EXECUTE FUNCTION sna_update_timestamp();

DROP TRIGGER IF EXISTS tr_sna_budgets_updated ON public.sna_budgets;
CREATE TRIGGER tr_sna_budgets_updated
  BEFORE UPDATE ON public.sna_budgets
  FOR EACH ROW EXECUTE FUNCTION sna_update_timestamp();

DROP TRIGGER IF EXISTS tr_sna_flags_updated ON public.sna_feature_flags;
CREATE TRIGGER tr_sna_flags_updated
  BEFORE UPDATE ON public.sna_feature_flags
  FOR EACH ROW EXECUTE FUNCTION sna_update_timestamp();

DROP TRIGGER IF EXISTS tr_sna_conv_updated ON public.sna_conversations;
CREATE TRIGGER tr_sna_conv_updated
  BEFORE UPDATE ON public.sna_conversations
  FOR EACH ROW EXECUTE FUNCTION sna_update_timestamp();

-- Trigger para atualizar conversation stats
CREATE OR REPLACE FUNCTION sna_update_conversation_stats()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sna_message_stats ON public.sna_messages;
CREATE TRIGGER tr_sna_message_stats
  AFTER INSERT ON public.sna_messages
  FOR EACH ROW EXECUTE FUNCTION sna_update_conversation_stats();

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
    -- Fibonacci aproximado
    v_delay_seconds := v_job.base_delay_seconds * (
      CASE v_job.attempts
        WHEN 1 THEN 1 WHEN 2 THEN 1 WHEN 3 THEN 2 WHEN 4 THEN 3 WHEN 5 THEN 5
        ELSE 8
      END
    );
  ELSE -- linear
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

-- 4.10 Cache get/set
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

-- ============================================================
-- PARTE 5: RLS COMPLETO
-- ============================================================

ALTER TABLE public.sna_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_tool_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_healthchecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_embeddings ENABLE ROW LEVEL SECURITY;

-- Função de verificação de admin SNA
CREATE OR REPLACE FUNCTION public.is_sna_admin()
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

-- Políticas para sna_jobs
DROP POLICY IF EXISTS "sna_jobs_select" ON public.sna_jobs;
CREATE POLICY "sna_jobs_select" ON public.sna_jobs
  FOR SELECT USING (created_by = auth.uid() OR is_sna_admin());

DROP POLICY IF EXISTS "sna_jobs_insert" ON public.sna_jobs;
CREATE POLICY "sna_jobs_insert" ON public.sna_jobs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "sna_jobs_update" ON public.sna_jobs;
CREATE POLICY "sna_jobs_update" ON public.sna_jobs
  FOR UPDATE USING (is_sna_admin());

-- Políticas para sna_tool_runs
DROP POLICY IF EXISTS "sna_tool_runs_select" ON public.sna_tool_runs;
CREATE POLICY "sna_tool_runs_select" ON public.sna_tool_runs
  FOR SELECT USING (user_id = auth.uid() OR is_sna_admin());

DROP POLICY IF EXISTS "sna_tool_runs_insert" ON public.sna_tool_runs;
CREATE POLICY "sna_tool_runs_insert" ON public.sna_tool_runs
  FOR INSERT WITH CHECK (TRUE);

-- Políticas para admin-only
DROP POLICY IF EXISTS "sna_budgets_admin" ON public.sna_budgets;
CREATE POLICY "sna_budgets_admin" ON public.sna_budgets
  FOR ALL USING (is_sna_admin());

DROP POLICY IF EXISTS "sna_health_admin" ON public.sna_healthchecks;
CREATE POLICY "sna_health_admin" ON public.sna_healthchecks
  FOR ALL USING (is_sna_admin());

DROP POLICY IF EXISTS "sna_flags_select" ON public.sna_feature_flags;
CREATE POLICY "sna_flags_select" ON public.sna_feature_flags
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "sna_flags_manage" ON public.sna_feature_flags;
CREATE POLICY "sna_flags_manage" ON public.sna_feature_flags
  FOR ALL USING (is_sna_admin());

DROP POLICY IF EXISTS "sna_rate_all" ON public.sna_rate_limits;
CREATE POLICY "sna_rate_all" ON public.sna_rate_limits FOR ALL USING (TRUE);

DROP POLICY IF EXISTS "sna_cache_all" ON public.sna_cache;
CREATE POLICY "sna_cache_all" ON public.sna_cache FOR ALL USING (TRUE);

-- Políticas para conversations
DROP POLICY IF EXISTS "sna_conv_own" ON public.sna_conversations;
CREATE POLICY "sna_conv_own" ON public.sna_conversations
  FOR ALL USING (user_id = auth.uid() OR is_sna_admin());

DROP POLICY IF EXISTS "sna_msg_own" ON public.sna_messages;
CREATE POLICY "sna_msg_own" ON public.sna_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sna_conversations c 
      WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR is_sna_admin())
    )
  );

DROP POLICY IF EXISTS "sna_embed_admin" ON public.sna_embeddings;
CREATE POLICY "sna_embed_admin" ON public.sna_embeddings
  FOR ALL USING (is_sna_admin());

-- ============================================================
-- PARTE 6: DADOS INICIAIS
-- ============================================================

-- Feature Flags
INSERT INTO public.sna_feature_flags (flag_key, category, description, is_enabled, allowed_roles, rollout_percentage) VALUES
  ('sna.tutor.enabled', 'tutor', 'IA Tutor para alunos', TRUE, ARRAY['owner', 'admin', 'beta'], 100),
  ('sna.tutor.streaming', 'tutor', 'Streaming de respostas', TRUE, ARRAY['owner', 'admin', 'beta'], 100),
  ('sna.tutor.context_window', 'tutor', 'Janela de contexto expandida', TRUE, ARRAY['owner', 'admin'], 100),
  ('sna.flashcards.generate', 'content', 'Geração de flashcards', TRUE, ARRAY['owner', 'admin', 'beta'], 100),
  ('sna.mindmap.generate', 'content', 'Geração de mapas mentais', TRUE, ARRAY['owner', 'admin', 'beta'], 100),
  ('sna.cronograma.generate', 'content', 'Geração de cronogramas', TRUE, ARRAY['owner', 'admin', 'beta'], 100),
  ('sna.import.url', 'admin', 'Importar questões de URL', TRUE, ARRAY['owner', 'admin'], 100),
  ('sna.import.pdf', 'admin', 'Importar questões de PDF', TRUE, ARRAY['owner', 'admin'], 100),
  ('sna.live.summary', 'live', 'Resumo de perguntas em lives', TRUE, ARRAY['owner', 'admin'], 100),
  ('sna.whatsapp.auto', 'automation', 'Automações WhatsApp', TRUE, ARRAY['owner', 'admin'], 100),
  ('sna.email.auto', 'automation', 'Automações de email', TRUE, ARRAY['owner', 'admin'], 100),
  ('sna.voice.narration', 'content', 'Narração com voz', FALSE, ARRAY['owner'], 50),
  ('sna.perplexity.web', 'tools', 'Respostas com fontes web', FALSE, ARRAY['owner', 'admin'], 30),
  ('sna.rag.enabled', 'advanced', 'RAG para contexto', TRUE, ARRAY['owner', 'admin'], 100),
  ('sna.cache.responses', 'performance', 'Cache de respostas', TRUE, ARRAY['owner', 'admin', 'beta'], 100)
ON CONFLICT (flag_key) DO UPDATE SET updated_at = NOW();

-- Budgets iniciais
INSERT INTO public.sna_budgets (scope, scope_id, period, period_start, period_end, limit_usd, limit_requests, limit_tokens) VALUES
  ('global', 'global', 'month', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', 200.00, 100000, 50000000),
  ('global', 'global', 'day', date_trunc('day', NOW()), date_trunc('day', NOW()) + INTERVAL '1 day', 20.00, 10000, 5000000),
  ('tool', 'gpt5', 'month', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', 80.00, NULL, NULL),
  ('tool', 'gemini_pro', 'month', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', 50.00, NULL, NULL),
  ('tool', 'gemini_flash', 'month', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', 30.00, NULL, NULL),
  ('tool', 'perplexity', 'month', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', 20.00, NULL, NULL),
  ('role', 'beta', 'day', date_trunc('day', NOW()), date_trunc('day', NOW()) + INTERVAL '1 day', 2.00, 100, 100000)
ON CONFLICT (scope, scope_id, period, period_start) DO NOTHING;

-- ============================================================
-- PARTE 7: REALTIME
-- ============================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sna_jobs;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sna_healthchecks;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sna_conversations;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sna_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE public.sna_jobs IS 'SNA OMEGA: Fila de jobs com idempotência, retry inteligente, hierarquia e métricas completas';
COMMENT ON TABLE public.sna_tool_runs IS 'SNA OMEGA: Auditoria detalhada de todas as chamadas a ferramentas de IA';
COMMENT ON TABLE public.sna_budgets IS 'SNA OMEGA: Controle de orçamento multi-dimensional com ações automáticas';
COMMENT ON TABLE public.sna_healthchecks IS 'SNA OMEGA: Histórico de healthchecks com detecção de mudanças';
COMMENT ON TABLE public.sna_feature_flags IS 'SNA OMEGA: Feature flags avançados com segmentação e rollout';
COMMENT ON TABLE public.sna_rate_limits IS 'SNA OMEGA: Rate limiting avançado com penalidades';
COMMENT ON TABLE public.sna_cache IS 'SNA OMEGA: Cache inteligente com economia de custos';
COMMENT ON TABLE public.sna_conversations IS 'SNA OMEGA: Threads de conversação persistentes';
COMMENT ON TABLE public.sna_messages IS 'SNA OMEGA: Mensagens com feedback e ações';
COMMENT ON TABLE public.sna_embeddings IS 'SNA OMEGA: Vetores para RAG (Retrieval Augmented Generation)';
