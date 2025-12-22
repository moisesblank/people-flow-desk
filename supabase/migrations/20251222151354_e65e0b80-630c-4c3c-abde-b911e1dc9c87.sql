-- ============================================================
-- 🧠 SNA OMEGA v5.0 - PARTE 7: TABELAS CORE
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
  retry_strategy TEXT DEFAULT 'exponential',
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
  
  -- Resultado simplificado
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
  action_on_limit TEXT DEFAULT 'block',
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
  rollout_strategy TEXT DEFAULT 'percentage',
  
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
  identifier_type TEXT DEFAULT 'user_id',
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
  cache_type TEXT DEFAULT 'response',
  
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

-- ============================================================
-- RLS para tabelas SNA
-- ============================================================

ALTER TABLE public.sna_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_tool_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_healthchecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "sna_jobs_owner_admin" ON public.sna_jobs
  FOR ALL USING (
    is_owner(auth.uid()) OR 
    (created_by = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "sna_tool_runs_owner_admin" ON public.sna_tool_runs
  FOR ALL USING (
    is_owner(auth.uid()) OR 
    (user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "sna_budgets_owner_admin" ON public.sna_budgets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "sna_healthchecks_owner_admin" ON public.sna_healthchecks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "sna_healthchecks_insert" ON public.sna_healthchecks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "sna_feature_flags_owner_admin" ON public.sna_feature_flags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "sna_rate_limits_system" ON public.sna_rate_limits
  FOR ALL USING (true);

CREATE POLICY "sna_cache_system" ON public.sna_cache
  FOR ALL USING (true);

-- Comentários
COMMENT ON TABLE public.sna_jobs IS '🧠 SNA: Fila de jobs com retry avançado, hierarquia e métricas';
COMMENT ON TABLE public.sna_tool_runs IS '🧠 SNA: Auditoria detalhada de chamadas IA';
COMMENT ON TABLE public.sna_budgets IS '🧠 SNA: Orçamento multi-dimensional por escopo e período';
COMMENT ON TABLE public.sna_healthchecks IS '🧠 SNA: Healthchecks de serviços externos';
COMMENT ON TABLE public.sna_feature_flags IS '🧠 SNA: Feature flags com rollout progressivo';
COMMENT ON TABLE public.sna_rate_limits IS '🧠 SNA: Rate limiting avançado por endpoint';
COMMENT ON TABLE public.sna_cache IS '🧠 SNA: Cache de respostas IA';