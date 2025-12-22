
-- ============================================
-- 🔥 VIDEO FORTRESS OMEGA v5.0 - PARTE 2
-- + MATRIZ DE FUNCIONALIDADES OMEGA
-- ============================================

-- ============================================
-- 1. FUNÇÕES DE VIOLAÇÃO E MÉTRICAS
-- ============================================

-- 1.1 Registrar violação (SANCTUM 2.0)
CREATE OR REPLACE FUNCTION register_video_violation_omega(
  p_session_token TEXT,
  p_violation_type TEXT,
  p_severity INTEGER DEFAULT 1,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  success BOOLEAN,
  risk_score INTEGER,
  action_taken TEXT,
  is_revoked BOOLEAN
) AS $$
DECLARE
  v_session RECORD;
  v_user_role TEXT;
  v_is_immune BOOLEAN;
  v_current_score INTEGER;
  v_new_score INTEGER;
  v_action TEXT;
  v_score_increment INTEGER;
BEGIN
  -- Buscar sessão
  SELECT * INTO v_session
  FROM public.video_play_sessions
  WHERE session_token = p_session_token;
  
  IF v_session IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'none'::TEXT, FALSE;
    RETURN;
  END IF;
  
  -- Verificar se usuário é imune
  v_is_immune := v_session.sanctum_immune = TRUE;
  
  IF NOT v_is_immune THEN
    -- Verificar role do usuário
    SELECT role INTO v_user_role FROM public.profiles WHERE id = v_session.user_id;
    v_is_immune := v_user_role IN ('owner', 'admin', 'funcionario', 'suporte', 'coordenacao', 'employee', 'monitoria');
  END IF;
  
  -- Buscar score atual
  SELECT current_score INTO v_current_score
  FROM public.video_user_risk_scores
  WHERE user_id = v_session.user_id;
  
  v_current_score := COALESCE(v_current_score, 0);
  
  -- Calcular novo score
  IF v_is_immune THEN
    v_score_increment := 0;
    v_new_score := v_current_score;
    v_action := 'bypassed';
  ELSE
    v_score_increment := p_severity * 3;
    v_new_score := v_current_score + v_score_increment;
    
    -- Determinar ação (thresholds ALTOS do SANCTUM 2.0)
    IF v_new_score >= 800 AND p_severity >= 8 THEN
      v_action := 'revoke';
    ELSIF v_new_score >= 400 THEN
      v_action := 'reauth';
    ELSIF v_new_score >= 200 THEN
      v_action := 'pause';
    ELSIF v_new_score >= 100 THEN
      v_action := 'degrade';
    ELSIF v_new_score >= 50 THEN
      v_action := 'warn';
    ELSE
      v_action := 'none';
    END IF;
    
    -- Atualizar score
    INSERT INTO public.video_user_risk_scores (user_id, current_score, violation_count, last_violation_at, last_violation_type)
    VALUES (v_session.user_id, v_new_score, 1, now(), p_violation_type)
    ON CONFLICT (user_id) DO UPDATE SET
      current_score = v_new_score,
      violation_count = video_user_risk_scores.violation_count + 1,
      last_violation_at = now(),
      last_violation_type = p_violation_type;
  END IF;
  
  -- Logar violação
  INSERT INTO public.video_violations (
    session_id,
    user_id,
    violation_type,
    severity,
    action_taken,
    risk_score_at_time,
    details
  ) VALUES (
    v_session.id,
    v_session.user_id,
    p_violation_type,
    p_severity,
    v_action,
    v_new_score,
    p_details || jsonb_build_object(
      'is_immune', v_is_immune,
      'score_before', v_current_score,
      'score_increment', v_score_increment
    )
  );
  
  -- Atualizar contador na sessão
  UPDATE public.video_play_sessions
  SET violation_count = violation_count + 1
  WHERE id = v_session.id;
  
  -- Revogar se necessário
  IF v_action = 'revoke' AND NOT v_is_immune THEN
    UPDATE public.video_play_sessions
    SET revoked_at = now(),
        revoke_reason = 'VIOLATION:' || p_violation_type
    WHERE id = v_session.id;
    
    -- Incrementar contador de revogações
    UPDATE public.video_user_risk_scores
    SET session_revoke_count = session_revoke_count + 1
    WHERE user_id = v_session.user_id;
    
    RETURN QUERY SELECT TRUE, v_new_score, v_action, TRUE;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT TRUE, v_new_score, v_action, FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.2 Encerrar sessão
CREATE OR REPLACE FUNCTION end_video_session_omega(p_session_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.video_play_sessions
  SET ended_at = now()
  WHERE session_token = p_session_token
    AND ended_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.3 Decay de risk score
CREATE OR REPLACE FUNCTION decay_video_risk_scores()
RETURNS INTEGER AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  WITH decayed AS (
    UPDATE public.video_user_risk_scores
    SET current_score = GREATEST(0, current_score - decay_rate_per_day),
        last_decay_at = now()
    WHERE last_decay_at < now() - interval '1 day'
      AND current_score > 0
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_affected FROM decayed;
  
  RETURN v_affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.4 Cleanup de sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_video_sessions_omega()
RETURNS INTEGER AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  WITH expired AS (
    UPDATE public.video_play_sessions
    SET ended_at = now(),
        revoke_reason = 'EXPIRED'
    WHERE expires_at < now()
      AND revoked_at IS NULL
      AND ended_at IS NULL
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_affected FROM expired;
  
  RETURN v_affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.5 Obter métricas de vídeo
CREATE OR REPLACE FUNCTION get_video_metrics(p_days INTEGER DEFAULT 7)
RETURNS TABLE(
  total_sessions BIGINT,
  active_sessions BIGINT,
  total_violations BIGINT,
  unique_users BIGINT,
  avg_watch_seconds NUMERIC,
  revoked_sessions BIGINT,
  immune_sessions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE vps.revoked_at IS NULL AND vps.ended_at IS NULL AND vps.expires_at > now())::BIGINT,
    (SELECT COUNT(*) FROM public.video_violations WHERE created_at > now() - (p_days || ' days')::interval)::BIGINT,
    COUNT(DISTINCT vps.user_id)::BIGINT,
    ROUND(AVG(vps.total_watch_time_seconds)::NUMERIC, 2),
    COUNT(*) FILTER (WHERE vps.revoked_at IS NOT NULL)::BIGINT,
    COUNT(*) FILTER (WHERE vps.sanctum_immune = TRUE)::BIGINT
  FROM public.video_play_sessions vps
  WHERE vps.created_at > now() - (p_days || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.6 Helper: is_video_admin
CREATE OR REPLACE FUNCTION is_video_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin', 'funcionario')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 2. RLS POLICIES (ATUALIZADAS)
-- ============================================

-- video_play_sessions
DROP POLICY IF EXISTS "vps_select" ON public.video_play_sessions;
CREATE POLICY "vps_select" ON public.video_play_sessions
  FOR SELECT USING (user_id = auth.uid() OR is_video_admin());

DROP POLICY IF EXISTS "vps_insert" ON public.video_play_sessions;
CREATE POLICY "vps_insert" ON public.video_play_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- video_access_logs
DROP POLICY IF EXISTS "val_select" ON public.video_access_logs;
CREATE POLICY "val_select" ON public.video_access_logs
  FOR SELECT USING (user_id = auth.uid() OR is_video_admin());

DROP POLICY IF EXISTS "val_insert" ON public.video_access_logs;
CREATE POLICY "val_insert" ON public.video_access_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- video_violations
DROP POLICY IF EXISTS "vv_select" ON public.video_violations;
CREATE POLICY "vv_select" ON public.video_violations
  FOR SELECT USING (user_id = auth.uid() OR is_video_admin());

DROP POLICY IF EXISTS "vv_insert" ON public.video_violations;
CREATE POLICY "vv_insert" ON public.video_violations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- video_user_risk_scores
DROP POLICY IF EXISTS "vurs_select" ON public.video_user_risk_scores;
CREATE POLICY "vurs_select" ON public.video_user_risk_scores
  FOR SELECT USING (user_id = auth.uid() OR is_video_admin());

-- video_domain_whitelist (somente admins)
DROP POLICY IF EXISTS "vdw_select" ON public.video_domain_whitelist;
CREATE POLICY "vdw_select" ON public.video_domain_whitelist
  FOR SELECT USING (is_video_admin() OR TRUE);

-- ============================================
-- 3. GRANTS
-- ============================================
GRANT EXECUTE ON FUNCTION register_video_violation_omega TO authenticated;
GRANT EXECUTE ON FUNCTION end_video_session_omega TO authenticated;
GRANT EXECUTE ON FUNCTION get_video_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION is_video_admin TO authenticated;
GRANT EXECUTE ON FUNCTION decay_video_risk_scores TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_video_sessions_omega TO authenticated;

-- ============================================
-- 4. MATRIZ DE FUNCIONALIDADES OMEGA
-- ============================================

-- 4.1 dead_click_reports
CREATE TABLE IF NOT EXISTS public.dead_click_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_type TEXT NOT NULL,
  element_text TEXT,
  element_selector TEXT NOT NULL,
  page_url TEXT NOT NULL,
  page_path TEXT NOT NULL,
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT NULL,
  device_info JSONB NULL,
  component_name TEXT NULL,
  action_expected TEXT NULL,
  issues TEXT[] NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ NULL,
  resolved_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dcr_page_path ON public.dead_click_reports(page_path);
CREATE INDEX IF NOT EXISTS idx_dcr_resolved ON public.dead_click_reports(resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dcr_user ON public.dead_click_reports(user_id) WHERE user_id IS NOT NULL;

-- 4.2 ui_function_registry
CREATE TABLE IF NOT EXISTS public.ui_function_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  ui_triggers JSONB NOT NULL DEFAULT '[]'::jsonb,
  route_key TEXT NULL,
  action_key TEXT NULL,
  backend_mode TEXT NOT NULL DEFAULT 'supabase-client',
  backend_handlers JSONB NOT NULL DEFAULT '[]'::jsonb,
  storage_operations JSONB NULL,
  auth_required BOOLEAN NOT NULL DEFAULT TRUE,
  roles_allowed TEXT[] NOT NULL DEFAULT ARRAY['owner'],
  rls_tables TEXT[] NULL,
  abuse_controls TEXT[] NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ufr_domain ON public.ui_function_registry(domain);
CREATE INDEX IF NOT EXISTS idx_ufr_status ON public.ui_function_registry(status);

-- 4.3 ui_audit_events
CREATE TABLE IF NOT EXISTS public.ui_audit_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  page_path TEXT NOT NULL,
  function_id TEXT NULL,
  component_name TEXT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT NULL,
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT NULL,
  session_id TEXT NULL,
  metadata JSONB NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uae_type ON public.ui_audit_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uae_user ON public.ui_audit_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_uae_path ON public.ui_audit_events(page_path, created_at DESC);

-- 4.4 url_access_logs
CREATE TABLE IF NOT EXISTS public.url_access_logs (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  domain TEXT NOT NULL,
  allowed BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  redirect_to TEXT NULL,
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT NULL,
  ip INET NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ual_path ON public.url_access_logs(path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ual_user ON public.url_access_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ual_denied ON public.url_access_logs(allowed, created_at DESC) WHERE allowed = FALSE;

-- ============================================
-- 5. RLS PARA MATRIZ
-- ============================================
ALTER TABLE public.dead_click_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_function_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_access_logs ENABLE ROW LEVEL SECURITY;

-- dead_click_reports: usuário pode inserir, admin pode ver tudo
CREATE POLICY "dcr_insert" ON public.dead_click_reports
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "dcr_select" ON public.dead_click_reports
  FOR SELECT USING (user_id = auth.uid() OR is_video_admin());

-- ui_function_registry: leitura para todos, escrita para admin
CREATE POLICY "ufr_select" ON public.ui_function_registry
  FOR SELECT USING (TRUE);
CREATE POLICY "ufr_admin" ON public.ui_function_registry
  FOR ALL USING (is_video_admin());

-- ui_audit_events: inserção permitida, leitura para admin
CREATE POLICY "uae_insert" ON public.ui_audit_events
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "uae_select" ON public.ui_audit_events
  FOR SELECT USING (user_id = auth.uid() OR is_video_admin());

-- url_access_logs: inserção permitida, leitura para admin
CREATE POLICY "ual_insert" ON public.url_access_logs
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "ual_select" ON public.url_access_logs
  FOR SELECT USING (user_id = auth.uid() OR is_video_admin());

-- ============================================
-- 6. GRANTS MATRIZ
-- ============================================
GRANT SELECT, INSERT ON public.dead_click_reports TO authenticated;
GRANT SELECT ON public.ui_function_registry TO authenticated;
GRANT SELECT, INSERT ON public.ui_audit_events TO authenticated;
GRANT SELECT, INSERT ON public.url_access_logs TO authenticated;

-- ============================================
-- 7. COMENTÁRIOS
-- ============================================
COMMENT ON FUNCTION register_video_violation_omega IS 'OMEGA SANCTUM 2.0: Registra violação com thresholds altos e bypass para admins';
COMMENT ON FUNCTION get_video_metrics IS 'OMEGA: Retorna métricas agregadas de vídeo dos últimos N dias';
COMMENT ON TABLE public.dead_click_reports IS 'MATRIZ: Registra cliques em elementos sem destino';
COMMENT ON TABLE public.ui_function_registry IS 'MATRIZ: Registro central de funções do sistema';
COMMENT ON TABLE public.ui_audit_events IS 'MATRIZ: Log de eventos de auditoria de UI';
COMMENT ON TABLE public.url_access_logs IS 'MATRIZ: Log de acessos por URL';
