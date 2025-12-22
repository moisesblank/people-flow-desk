-- ============================================================
-- 🧠 SNA OMEGA v5.0 - TABELAS COMPLEMENTARES
-- ============================================================

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

-- RLS para sna_tool_runs
ALTER TABLE public.sna_tool_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sna_tool_runs_owner_all" ON public.sna_tool_runs;
CREATE POLICY "sna_tool_runs_owner_all" ON public.sna_tool_runs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner')
    );

DROP POLICY IF EXISTS "sna_tool_runs_system_insert" ON public.sna_tool_runs;
CREATE POLICY "sna_tool_runs_system_insert" ON public.sna_tool_runs
    FOR INSERT WITH CHECK (true);

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

-- RLS para sna_budgets
ALTER TABLE public.sna_budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sna_budgets_owner_all" ON public.sna_budgets;
CREATE POLICY "sna_budgets_owner_all" ON public.sna_budgets
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner')
    );

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

-- RLS para sna_healthchecks
ALTER TABLE public.sna_healthchecks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sna_health_owner_read" ON public.sna_healthchecks;
CREATE POLICY "sna_health_owner_read" ON public.sna_healthchecks
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

DROP POLICY IF EXISTS "sna_health_system_insert" ON public.sna_healthchecks;
CREATE POLICY "sna_health_system_insert" ON public.sna_healthchecks
    FOR INSERT WITH CHECK (true);

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

-- RLS para sna_feature_flags
ALTER TABLE public.sna_feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sna_flags_owner_all" ON public.sna_feature_flags;
CREATE POLICY "sna_flags_owner_all" ON public.sna_feature_flags
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner')
    );

DROP POLICY IF EXISTS "sna_flags_read_all" ON public.sna_feature_flags;
CREATE POLICY "sna_flags_read_all" ON public.sna_feature_flags
    FOR SELECT USING (true);

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

-- RLS para sna_rate_limits
ALTER TABLE public.sna_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sna_rate_owner_all" ON public.sna_rate_limits;
CREATE POLICY "sna_rate_owner_all" ON public.sna_rate_limits
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner')
    );

DROP POLICY IF EXISTS "sna_rate_system_all" ON public.sna_rate_limits;
CREATE POLICY "sna_rate_system_all" ON public.sna_rate_limits
    FOR ALL USING (true);

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

-- RLS para sna_cache
ALTER TABLE public.sna_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sna_cache_system_all" ON public.sna_cache;
CREATE POLICY "sna_cache_system_all" ON public.sna_cache FOR ALL USING (true);

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
  status TEXT DEFAULT 'active',
  
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

-- RLS para sna_conversations
ALTER TABLE public.sna_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sna_conv_user_all" ON public.sna_conversations;
CREATE POLICY "sna_conv_user_all" ON public.sna_conversations
    FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "sna_conv_owner_read" ON public.sna_conversations;
CREATE POLICY "sna_conv_owner_read" ON public.sna_conversations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner')
    );

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

-- RLS para sna_messages
ALTER TABLE public.sna_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sna_msg_user_all" ON public.sna_messages;
CREATE POLICY "sna_msg_user_all" ON public.sna_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.sna_conversations c
            WHERE c.id = sna_messages.conversation_id AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "sna_msg_owner_read" ON public.sna_messages;
CREATE POLICY "sna_msg_owner_read" ON public.sna_messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner')
    );

-- 2.10 SNA_EMBEDDINGS: Vetores para RAG (sem pgvector por enquanto)
CREATE TABLE IF NOT EXISTS public.sna_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Fonte
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  chunk_index INT DEFAULT 0,
  
  -- Conteúdo
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  
  -- Embedding como JSONB (array de floats) - alternativa ao VECTOR
  embedding JSONB,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Tags para filtro
  tags TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS sna_embed_source_idx ON public.sna_embeddings (source_type, source_id);
CREATE INDEX IF NOT EXISTS sna_embed_hash_idx ON public.sna_embeddings (content_hash);
CREATE INDEX IF NOT EXISTS sna_embed_tags_idx ON public.sna_embeddings USING GIN (tags);

-- RLS para sna_embeddings
ALTER TABLE public.sna_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sna_embed_owner_all" ON public.sna_embeddings;
CREATE POLICY "sna_embed_owner_all" ON public.sna_embeddings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner')
    );

DROP POLICY IF EXISTS "sna_embed_system_all" ON public.sna_embeddings;
CREATE POLICY "sna_embed_system_all" ON public.sna_embeddings
    FOR ALL USING (true);

-- ============================================================
-- TRIGGERS DE UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION public.sna_updated_at_trigger()
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

DROP TRIGGER IF EXISTS trigger_sna_budgets_updated_at ON public.sna_budgets;
CREATE TRIGGER trigger_sna_budgets_updated_at
    BEFORE UPDATE ON public.sna_budgets
    FOR EACH ROW EXECUTE FUNCTION public.sna_updated_at_trigger();

DROP TRIGGER IF EXISTS trigger_sna_flags_updated_at ON public.sna_feature_flags;
CREATE TRIGGER trigger_sna_flags_updated_at
    BEFORE UPDATE ON public.sna_feature_flags
    FOR EACH ROW EXECUTE FUNCTION public.sna_updated_at_trigger();

DROP TRIGGER IF EXISTS trigger_sna_conv_updated_at ON public.sna_conversations;
CREATE TRIGGER trigger_sna_conv_updated_at
    BEFORE UPDATE ON public.sna_conversations
    FOR EACH ROW EXECUTE FUNCTION public.sna_updated_at_trigger();

-- ============================================================
-- COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE public.sna_tool_runs IS '🧠 SNA: Auditoria detalhada de execuções de ferramentas IA';
COMMENT ON TABLE public.sna_budgets IS '🧠 SNA: Orçamentos multi-dimensionais para controle de custos';
COMMENT ON TABLE public.sna_healthchecks IS '🧠 SNA: Healthchecks de serviços externos';
COMMENT ON TABLE public.sna_feature_flags IS '🧠 SNA: Feature flags com rollout gradual';
COMMENT ON TABLE public.sna_rate_limits IS '🧠 SNA: Rate limiting avançado por endpoint';
COMMENT ON TABLE public.sna_cache IS '🧠 SNA: Cache de respostas para economia de custos';
COMMENT ON TABLE public.sna_conversations IS '🧠 SNA: Threads de conversação com IAs';
COMMENT ON TABLE public.sna_messages IS '🧠 SNA: Mensagens das conversações';
COMMENT ON TABLE public.sna_embeddings IS '🧠 SNA: Embeddings para RAG';