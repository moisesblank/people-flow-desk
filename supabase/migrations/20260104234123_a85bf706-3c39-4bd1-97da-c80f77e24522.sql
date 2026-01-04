-- ============================================
-- 🏛️ FASE FINAL — GO-LIVE / PRODUÇÃO / AUDITORIA
-- Constituição SYNAPSE Ω v10.0
-- ============================================

-- ========================================
-- A. CONSENTIMENTO LEGAL (Hard Mode)
-- ========================================

-- Tabela de termos versionados
CREATE TABLE IF NOT EXISTS public.simulado_consent_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(20) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  activated_at TIMESTAMPTZ
);

-- Registro de aceite de consentimento
CREATE TABLE IF NOT EXISTS public.simulado_consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  simulado_id UUID NOT NULL,
  term_version VARCHAR(20) NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT now(),
  ip_hash TEXT, -- Hash do IP (não armazena IP direto)
  user_agent_hash TEXT,
  device_fingerprint TEXT,
  consent_type VARCHAR(50) DEFAULT 'hard_mode', -- hard_mode, camera, terms
  is_valid BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_consent_logs_user ON public.simulado_consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_simulado ON public.simulado_consent_logs(simulado_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_accepted ON public.simulado_consent_logs(accepted_at);

-- ========================================
-- B. FEATURE FLAGS (Rollback/Contingência)
-- ========================================

CREATE TABLE IF NOT EXISTS public.simulado_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key VARCHAR(100) NOT NULL UNIQUE,
  flag_value BOOLEAN DEFAULT true,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'
);

-- Inserir flags globais
INSERT INTO public.simulado_feature_flags (flag_key, flag_value, description)
VALUES 
  ('simulados_enabled', true, 'Habilita/desabilita todo sistema de simulados'),
  ('hard_mode_enabled', true, 'Habilita/desabilita Modo Hard globalmente'),
  ('camera_monitoring_enabled', true, 'Habilita/desabilita monitoramento de câmera'),
  ('ranking_frozen', false, 'Congela ranking para auditoria'),
  ('new_attempts_blocked', false, 'Bloqueia novas tentativas (manutenção)')
ON CONFLICT (flag_key) DO NOTHING;

-- Feature flags por simulado
ALTER TABLE public.simulados 
  ADD COLUMN IF NOT EXISTS hard_mode_override VARCHAR(20) DEFAULT 'default', -- default, force_on, force_off
  ADD COLUMN IF NOT EXISTS is_ranking_frozen BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS maintenance_message TEXT;

-- ========================================
-- C. LOGS DE AUDITORIA (Observabilidade)
-- ========================================

CREATE TABLE IF NOT EXISTS public.simulado_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(20) NOT NULL, -- SIMULADO, TREINO, SYSTEM
  action VARCHAR(50) NOT NULL, -- START, FINISH, INVALIDATE, etc
  level VARCHAR(10) DEFAULT 'info', -- info, warn, error
  simulado_id UUID,
  attempt_id UUID,
  user_id UUID,
  session_id TEXT,
  ip_hash TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para queries de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_simulado ON public.simulado_audit_logs(simulado_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.simulado_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.simulado_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.simulado_audit_logs(created_at);

-- ========================================
-- D. RANKING AUDITÁVEL
-- ========================================

-- Snapshots de ranking para auditoria/exportação
CREATE TABLE IF NOT EXISTS public.simulado_ranking_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulado_id UUID,
  snapshot_type VARCHAR(20) NOT NULL, -- manual, scheduled, freeze
  ranking_data JSONB NOT NULL, -- Array de {rank, user_id, score, timestamp}
  total_participants INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  reason TEXT
);

-- Contestações de ranking
CREATE TABLE IF NOT EXISTS public.simulado_ranking_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  simulado_id UUID,
  attempt_id UUID,
  dispute_type VARCHAR(50) NOT NULL, -- score_error, invalidation_appeal, technical_issue
  description TEXT NOT NULL,
  evidence JSONB, -- Links, screenshots, etc
  status VARCHAR(20) DEFAULT 'pending', -- pending, under_review, resolved, rejected
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.simulado_ranking_disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_user ON public.simulado_ranking_disputes(user_id);

-- ========================================
-- E. MÉTRICAS E HEALTHCHECK
-- ========================================

CREATE TABLE IF NOT EXISTS public.simulado_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key VARCHAR(100) NOT NULL,
  metric_value NUMERIC DEFAULT 0,
  metric_type VARCHAR(20) DEFAULT 'counter', -- counter, gauge, histogram
  labels JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metrics_key ON public.simulado_metrics(metric_key);
CREATE INDEX IF NOT EXISTS idx_metrics_recorded ON public.simulado_metrics(recorded_at);

-- ========================================
-- F. RLS POLICIES
-- ========================================

-- Consent Logs: Usuário vê próprios, staff vê todos
ALTER TABLE public.simulado_consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent logs"
  ON public.simulado_consent_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent logs"
  ON public.simulado_consent_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all consent logs"
  ON public.simulado_consent_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coordenacao')
    )
  );

-- Feature Flags: Todos leem, apenas owner/admin escrevem
ALTER TABLE public.simulado_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feature flags"
  ON public.simulado_feature_flags FOR SELECT
  USING (true);

CREATE POLICY "Only owner/admin can update feature flags"
  ON public.simulado_feature_flags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Audit Logs: Staff only
ALTER TABLE public.simulado_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view audit logs"
  ON public.simulado_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coordenacao')
    )
  );

CREATE POLICY "Anyone can insert audit logs"
  ON public.simulado_audit_logs FOR INSERT
  WITH CHECK (true);

-- Ranking Snapshots: Staff only
ALTER TABLE public.simulado_ranking_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage ranking snapshots"
  ON public.simulado_ranking_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Disputes: User sees own, staff sees all
ALTER TABLE public.simulado_ranking_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and create own disputes"
  ON public.simulado_ranking_disputes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own disputes"
  ON public.simulado_ranking_disputes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all disputes"
  ON public.simulado_ranking_disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coordenacao')
    )
  );

CREATE POLICY "Staff can update disputes"
  ON public.simulado_ranking_disputes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coordenacao')
    )
  );

-- Metrics: Read all, insert all, staff can update
ALTER TABLE public.simulado_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read metrics"
  ON public.simulado_metrics FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert metrics"
  ON public.simulado_metrics FOR INSERT
  WITH CHECK (true);

-- Consent Terms: Anyone can read active, staff manages
ALTER TABLE public.simulado_consent_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active consent terms"
  ON public.simulado_consent_terms FOR SELECT
  USING (is_active = true);

CREATE POLICY "Staff can manage consent terms"
  ON public.simulado_consent_terms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ========================================
-- G. RPCs PARA OPERAÇÃO
-- ========================================

-- RPC para registrar consentimento
CREATE OR REPLACE FUNCTION public.register_simulado_consent(
  p_simulado_id UUID,
  p_term_version TEXT DEFAULT 'v1.0',
  p_consent_type TEXT DEFAULT 'hard_mode',
  p_ip_hash TEXT DEFAULT NULL,
  p_user_agent_hash TEXT DEFAULT NULL,
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_consent_id UUID;
BEGIN
  INSERT INTO simulado_consent_logs (
    user_id,
    simulado_id,
    term_version,
    consent_type,
    ip_hash,
    user_agent_hash,
    device_fingerprint
  ) VALUES (
    auth.uid(),
    p_simulado_id,
    p_term_version,
    p_consent_type,
    p_ip_hash,
    p_user_agent_hash,
    p_device_fingerprint
  )
  RETURNING id INTO v_consent_id;
  
  RETURN v_consent_id;
END;
$$;

-- RPC para verificar feature flag
CREATE OR REPLACE FUNCTION public.get_simulado_feature_flag(p_flag_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value BOOLEAN;
BEGIN
  SELECT flag_value INTO v_value
  FROM simulado_feature_flags
  WHERE flag_key = p_flag_key;
  
  RETURN COALESCE(v_value, true); -- Default true se não existir
END;
$$;

-- RPC para registrar log de auditoria
CREATE OR REPLACE FUNCTION public.log_simulado_audit(
  p_category TEXT,
  p_action TEXT,
  p_level TEXT DEFAULT 'info',
  p_simulado_id UUID DEFAULT NULL,
  p_attempt_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO simulado_audit_logs (
    category,
    action,
    level,
    simulado_id,
    attempt_id,
    user_id,
    session_id,
    ip_hash,
    details
  ) VALUES (
    p_category,
    p_action,
    p_level,
    p_simulado_id,
    p_attempt_id,
    auth.uid(),
    p_session_id,
    p_ip_hash,
    p_details
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- RPC para criar snapshot de ranking
CREATE OR REPLACE FUNCTION public.create_ranking_snapshot(
  p_simulado_id UUID DEFAULT NULL,
  p_snapshot_type TEXT DEFAULT 'manual',
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot_id UUID;
  v_ranking_data JSONB;
  v_total INTEGER;
BEGIN
  -- Verificar permissão (owner/admin)
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  -- Coletar ranking atual
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'rank', rank,
        'user_id', user_id,
        'score', score,
        'correct_answers', correct_answers,
        'total_questions', total_questions,
        'finished_at', finished_at
      ) ORDER BY rank
    ),
    COUNT(*)
  INTO v_ranking_data, v_total
  FROM (
    SELECT 
      ROW_NUMBER() OVER (ORDER BY score DESC, finished_at ASC) as rank,
      user_id,
      score,
      correct_answers,
      total_questions,
      finished_at
    FROM simulado_attempts
    WHERE 
      status = 'completed'
      AND is_scored_for_ranking = true
      AND (p_simulado_id IS NULL OR simulado_id = p_simulado_id)
  ) ranked;

  INSERT INTO simulado_ranking_snapshots (
    simulado_id,
    snapshot_type,
    ranking_data,
    total_participants,
    created_by,
    reason
  ) VALUES (
    p_simulado_id,
    p_snapshot_type,
    COALESCE(v_ranking_data, '[]'),
    COALESCE(v_total, 0),
    auth.uid(),
    p_reason
  )
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$;

-- RPC para abrir contestação
CREATE OR REPLACE FUNCTION public.open_ranking_dispute(
  p_simulado_id UUID,
  p_attempt_id UUID DEFAULT NULL,
  p_dispute_type TEXT DEFAULT 'technical_issue',
  p_description TEXT DEFAULT '',
  p_evidence JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dispute_id UUID;
BEGIN
  INSERT INTO simulado_ranking_disputes (
    user_id,
    simulado_id,
    attempt_id,
    dispute_type,
    description,
    evidence
  ) VALUES (
    auth.uid(),
    p_simulado_id,
    p_attempt_id,
    p_dispute_type,
    p_description,
    p_evidence
  )
  RETURNING id INTO v_dispute_id;

  RETURN v_dispute_id;
END;
$$;

-- RPC para registrar métrica
CREATE OR REPLACE FUNCTION public.record_simulado_metric(
  p_metric_key TEXT,
  p_metric_value NUMERIC DEFAULT 1,
  p_metric_type TEXT DEFAULT 'counter',
  p_labels JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metric_id UUID;
BEGIN
  INSERT INTO simulado_metrics (
    metric_key,
    metric_value,
    metric_type,
    labels
  ) VALUES (
    p_metric_key,
    p_metric_value,
    p_metric_type,
    p_labels
  )
  RETURNING id INTO v_metric_id;

  RETURN v_metric_id;
END;
$$;