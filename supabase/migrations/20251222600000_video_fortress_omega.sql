-- ============================================
-- 🔥🛡️ VIDEO FORTRESS OMEGA v5.0 🛡️🔥
-- MIGRAÇÃO SQL DEFINITIVA — SANCTUM 2.0
-- ============================================
-- ✅ Sessões de vídeo com suporte SANCTUM
-- ✅ Logs de acesso detalhados
-- ✅ Violações com bypass tracking
-- ✅ Risk scores com decay automático
-- ✅ RLS rigoroso com bypass para admins
-- ✅ Funções otimizadas para alta performance
-- ============================================

-- ============================================
-- 1. ENUMS
-- ============================================
DO $$ BEGIN
  CREATE TYPE video_provider AS ENUM ('panda', 'youtube', 'vimeo', 'cloudflare');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE video_action_type AS ENUM (
    'none',
    'warn',
    'degrade',
    'pause',
    'reauth',
    'revoke',
    'bypassed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. TABELA: video_play_sessions (OMEGA)
-- ============================================
CREATE TABLE IF NOT EXISTS public.video_play_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuário
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Conteúdo
  lesson_id UUID NULL,
  course_id UUID NULL,
  provider TEXT NOT NULL DEFAULT 'panda',
  provider_video_id TEXT NOT NULL,
  
  -- Sessão
  session_code TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  watermark_text TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NULL,
  revoked_at TIMESTAMPTZ NULL,
  revoke_reason TEXT NULL,
  
  -- SANCTUM
  sanctum_immune BOOLEAN NOT NULL DEFAULT FALSE,
  sanctum_bypass_reason TEXT NULL,
  
  -- Telemetria
  ip INET NULL,
  user_agent TEXT NULL,
  device_fingerprint TEXT NULL,
  
  -- Métricas
  total_watch_seconds INTEGER DEFAULT 0,
  heartbeat_count INTEGER DEFAULT 0,
  violation_count INTEGER DEFAULT 0
);

-- Índices otimizados
CREATE INDEX IF NOT EXISTS idx_vps_user_active 
  ON public.video_play_sessions(user_id) 
  WHERE revoked_at IS NULL AND ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vps_token 
  ON public.video_play_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_vps_expires 
  ON public.video_play_sessions(expires_at) 
  WHERE revoked_at IS NULL AND ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vps_lesson 
  ON public.video_play_sessions(lesson_id, created_at DESC)
  WHERE lesson_id IS NOT NULL;

-- ============================================
-- 3. TABELA: video_access_logs (OMEGA)
-- ============================================
CREATE TABLE IF NOT EXISTS public.video_access_logs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Referências
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NULL REFERENCES public.video_play_sessions(id) ON DELETE SET NULL,
  lesson_id UUID NULL,
  
  -- Vídeo
  provider_video_id TEXT NULL,
  provider TEXT NULL,
  
  -- Ação
  action TEXT NOT NULL,
  
  -- Detalhes
  details JSONB NULL DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_val_user_time 
  ON public.video_access_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_val_action 
  ON public.video_access_logs(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_val_session 
  ON public.video_access_logs(session_id)
  WHERE session_id IS NOT NULL;

-- ============================================
-- 4. TABELA: video_violations (OMEGA)
-- ============================================
CREATE TABLE IF NOT EXISTS public.video_violations (
  id BIGSERIAL PRIMARY KEY,
  
  -- Referências
  session_id UUID NULL REFERENCES public.video_play_sessions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Violação
  violation_type TEXT NOT NULL,
  severity INTEGER NOT NULL DEFAULT 1,
  
  -- SANCTUM
  action_taken TEXT NULL,
  risk_score_at_time INTEGER DEFAULT 0,
  
  -- Detalhes
  details JSONB NULL DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vv_user_time 
  ON public.video_violations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vv_type 
  ON public.video_violations(violation_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vv_session 
  ON public.video_violations(session_id)
  WHERE session_id IS NOT NULL;

-- ============================================
-- 5. TABELA: video_user_risk_scores (OMEGA)
-- ============================================
CREATE TABLE IF NOT EXISTS public.video_user_risk_scores (
  id BIGSERIAL PRIMARY KEY,
  
  -- Usuário (único)
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Score
  current_score INTEGER NOT NULL DEFAULT 0,
  max_score_ever INTEGER NOT NULL DEFAULT 0,
  
  -- Contadores
  violation_count INTEGER NOT NULL DEFAULT 0,
  session_revoke_count INTEGER NOT NULL DEFAULT 0,
  
  -- Última violação
  last_violation_at TIMESTAMPTZ NULL,
  last_violation_type TEXT NULL,
  
  -- Decay
  last_decay_at TIMESTAMPTZ DEFAULT now(),
  decay_rate_per_day INTEGER DEFAULT 5,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_risk_score_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.current_score > NEW.max_score_ever THEN
    NEW.max_score_ever = NEW.current_score;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_risk_score_updated ON public.video_user_risk_scores;
CREATE TRIGGER trg_risk_score_updated
  BEFORE UPDATE ON public.video_user_risk_scores
  FOR EACH ROW EXECUTE FUNCTION update_risk_score_timestamp();

-- ============================================
-- 6. TABELA: video_domain_whitelist
-- ============================================
CREATE TABLE IF NOT EXISTS public.video_domain_whitelist (
  id SERIAL PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dados iniciais
INSERT INTO public.video_domain_whitelist (domain, is_active) VALUES
  ('gestao.moisesmedeiros.com.br', true),
  ('pro.moisesmedeiros.com.br', true),
  ('www.moisesmedeiros.com.br', true),
  ('moisesmedeiros.com.br', true),
  ('localhost', true),
  ('127.0.0.1', true)
ON CONFLICT (domain) DO NOTHING;

-- ============================================
-- 7. FUNÇÕES SQL AVANÇADAS
-- ============================================

-- 7.1 Gerar código de sessão
CREATE OR REPLACE FUNCTION generate_video_session_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := 'MM-';
  i INTEGER;
BEGIN
  FOR i IN 1..4 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 7.2 Criar sessão de vídeo (com revogação automática)
CREATE OR REPLACE FUNCTION create_video_session(
  p_user_id UUID,
  p_lesson_id UUID,
  p_provider TEXT,
  p_provider_video_id TEXT,
  p_ttl_minutes INTEGER DEFAULT 5,
  p_watermark_text TEXT DEFAULT '',
  p_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_fingerprint TEXT DEFAULT NULL,
  p_sanctum_immune BOOLEAN DEFAULT FALSE,
  p_sanctum_bypass_reason TEXT DEFAULT NULL
)
RETURNS TABLE(
  session_id UUID,
  session_code TEXT,
  session_token TEXT,
  expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_session_code TEXT;
  v_session_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_session_id UUID;
BEGIN
  -- Revogar sessões anteriores do mesmo usuário
  UPDATE public.video_play_sessions
  SET revoked_at = now(),
      revoke_reason = 'NEW_SESSION'
  WHERE user_id = p_user_id
    AND revoked_at IS NULL
    AND ended_at IS NULL;
  
  -- Gerar códigos
  v_session_code := generate_video_session_code();
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + (p_ttl_minutes || ' minutes')::interval;
  
  -- Criar sessão
  INSERT INTO public.video_play_sessions (
    user_id,
    lesson_id,
    provider,
    provider_video_id,
    session_code,
    session_token,
    watermark_text,
    expires_at,
    ip,
    user_agent,
    device_fingerprint,
    sanctum_immune,
    sanctum_bypass_reason
  ) VALUES (
    p_user_id,
    p_lesson_id,
    p_provider,
    p_provider_video_id,
    v_session_code,
    v_session_token,
    p_watermark_text,
    v_expires_at,
    p_ip,
    p_user_agent,
    p_device_fingerprint,
    p_sanctum_immune,
    p_sanctum_bypass_reason
  )
  RETURNING id INTO v_session_id;
  
  RETURN QUERY SELECT v_session_id, v_session_code, v_session_token, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.3 Heartbeat de sessão
CREATE OR REPLACE FUNCTION video_session_heartbeat(
  p_session_token TEXT,
  p_position_seconds INTEGER DEFAULT 0
)
RETURNS TABLE(
  success BOOLEAN,
  is_valid BOOLEAN,
  new_expires_at TIMESTAMPTZ,
  message TEXT
) AS $$
DECLARE
  v_session RECORD;
  v_new_expires TIMESTAMPTZ;
BEGIN
  -- Buscar sessão
  SELECT * INTO v_session
  FROM public.video_play_sessions
  WHERE session_token = p_session_token;
  
  -- Sessão não existe
  IF v_session IS NULL THEN
    RETURN QUERY SELECT FALSE, FALSE, NULL::TIMESTAMPTZ, 'SESSION_NOT_FOUND';
    RETURN;
  END IF;
  
  -- Sessão revogada
  IF v_session.revoked_at IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, FALSE, NULL::TIMESTAMPTZ, 'SESSION_REVOKED';
    RETURN;
  END IF;
  
  -- Sessão encerrada
  IF v_session.ended_at IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, FALSE, NULL::TIMESTAMPTZ, 'SESSION_ENDED';
    RETURN;
  END IF;
  
  -- Sessão expirada
  IF v_session.expires_at < now() THEN
    RETURN QUERY SELECT FALSE, FALSE, NULL::TIMESTAMPTZ, 'SESSION_EXPIRED';
    RETURN;
  END IF;
  
  -- Atualizar heartbeat e estender expiração
  v_new_expires := now() + interval '5 minutes';
  
  UPDATE public.video_play_sessions
  SET last_heartbeat_at = now(),
      expires_at = v_new_expires,
      heartbeat_count = heartbeat_count + 1,
      total_watch_seconds = GREATEST(total_watch_seconds, p_position_seconds)
  WHERE id = v_session.id;
  
  RETURN QUERY SELECT TRUE, TRUE, v_new_expires, 'OK';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.4 Registrar violação (SANCTUM 2.0)
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

-- 7.5 Encerrar sessão
CREATE OR REPLACE FUNCTION end_video_session(p_session_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.video_play_sessions
  SET ended_at = now()
  WHERE session_token = p_session_token
    AND ended_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.6 Decay automático de risk score
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

-- 7.7 Cleanup de sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_video_sessions()
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

-- 7.8 Obter métricas de vídeo
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
    COUNT(*) FILTER (WHERE revoked_at IS NULL AND ended_at IS NULL AND expires_at > now())::BIGINT,
    (SELECT COUNT(*) FROM public.video_violations WHERE created_at > now() - (p_days || ' days')::interval)::BIGINT,
    COUNT(DISTINCT user_id)::BIGINT,
    ROUND(AVG(total_watch_seconds)::NUMERIC, 2),
    COUNT(*) FILTER (WHERE revoked_at IS NOT NULL)::BIGINT,
    COUNT(*) FILTER (WHERE sanctum_immune = TRUE)::BIGINT
  FROM public.video_play_sessions
  WHERE created_at > now() - (p_days || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. RLS POLICIES (SEGURANÇA MÁXIMA)
-- ============================================

ALTER TABLE public.video_play_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_user_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_domain_whitelist ENABLE ROW LEVEL SECURITY;

-- Helper: is_admin
CREATE OR REPLACE FUNCTION is_video_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin', 'funcionario')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  FOR SELECT USING (is_video_admin());

-- ============================================
-- 9. GRANTS
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.video_play_sessions TO authenticated;
GRANT INSERT ON public.video_play_sessions TO authenticated;
GRANT SELECT ON public.video_access_logs TO authenticated;
GRANT INSERT ON public.video_access_logs TO authenticated;
GRANT SELECT ON public.video_violations TO authenticated;
GRANT INSERT ON public.video_violations TO authenticated;
GRANT SELECT ON public.video_user_risk_scores TO authenticated;
GRANT SELECT ON public.video_domain_whitelist TO authenticated;

GRANT EXECUTE ON FUNCTION create_video_session TO authenticated;
GRANT EXECUTE ON FUNCTION video_session_heartbeat TO authenticated;
GRANT EXECUTE ON FUNCTION register_video_violation_omega TO authenticated;
GRANT EXECUTE ON FUNCTION end_video_session TO authenticated;
GRANT EXECUTE ON FUNCTION get_video_metrics TO authenticated;

-- ============================================
-- 10. REALTIME (opcional)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'video_play_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.video_play_sessions;
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- ============================================
-- ✅ FIM DA MIGRAÇÃO OMEGA v5.0
-- ============================================
