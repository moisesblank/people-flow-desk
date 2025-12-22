-- ============================================================
-- SNA OMEGA v5.0 - PARTE 2: Budgets, Healthchecks, Feature Flags
-- ============================================================

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

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.sna_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_healthchecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_feature_flags ENABLE ROW LEVEL SECURITY;

-- Budgets: Owner/Admin gerencia
CREATE POLICY "sna_budgets_admin_all" ON public.sna_budgets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "sna_budgets_user_read" ON public.sna_budgets
  FOR SELECT USING (scope = 'user' AND scope_id = auth.uid()::TEXT);

-- Healthchecks: Todos autenticados leem, sistema insere
CREATE POLICY "sna_health_authenticated_read" ON public.sna_healthchecks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sna_health_system_insert" ON public.sna_healthchecks
  FOR INSERT WITH CHECK (true);

-- Feature Flags: Admin gerencia, todos leem flags ativas
CREATE POLICY "sna_flags_admin_all" ON public.sna_feature_flags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "sna_flags_read_enabled" ON public.sna_feature_flags
  FOR SELECT USING (is_enabled = TRUE AND auth.uid() IS NOT NULL);

-- ============================================================
-- COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE public.sna_budgets IS '🧠 SNA: Orçamento multi-dimensional por escopo e período';
COMMENT ON TABLE public.sna_healthchecks IS '🧠 SNA: Histórico de healthchecks de serviços';
COMMENT ON TABLE public.sna_feature_flags IS '🧠 SNA: Feature flags com rollout gradual e segmentação';