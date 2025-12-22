
-- ============================================
-- 🔥🛡️ VIDEO FORTRESS OMEGA v5.0 🛡️🔥
-- MIGRAÇÃO SQL DEFINITIVA — SANCTUM 2.0
-- ============================================

-- ============================================
-- 1. ENUMS NOVOS
-- ============================================
DO $$ BEGIN
  CREATE TYPE video_provider AS ENUM ('panda', 'youtube', 'vimeo', 'cloudflare');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Adicionar valores ao enum video_action_type se não existirem
DO $$ BEGIN
  ALTER TYPE video_action_type ADD VALUE IF NOT EXISTS 'none';
  ALTER TYPE video_action_type ADD VALUE IF NOT EXISTS 'warn';
  ALTER TYPE video_action_type ADD VALUE IF NOT EXISTS 'degrade';
  ALTER TYPE video_action_type ADD VALUE IF NOT EXISTS 'pause';
  ALTER TYPE video_action_type ADD VALUE IF NOT EXISTS 'reauth';
  ALTER TYPE video_action_type ADD VALUE IF NOT EXISTS 'revoke';
  ALTER TYPE video_action_type ADD VALUE IF NOT EXISTS 'bypassed';
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================
-- 2. ATUALIZAR video_play_sessions (OMEGA)
-- ============================================
-- Adicionar colunas SANCTUM se não existirem
DO $$ BEGIN
  ALTER TABLE public.video_play_sessions ADD COLUMN IF NOT EXISTS sanctum_immune BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.video_play_sessions ADD COLUMN IF NOT EXISTS sanctum_bypass_reason TEXT NULL;
  ALTER TABLE public.video_play_sessions ADD COLUMN IF NOT EXISTS heartbeat_count INTEGER DEFAULT 0;
  
  -- Renomear colunas para consistência se existirem com nomes diferentes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'video_play_sessions' AND column_name = 'ip_address') THEN
    ALTER TABLE public.video_play_sessions RENAME COLUMN ip_address TO ip;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'video_play_sessions' AND column_name = 'total_watch_time_seconds') THEN
    ALTER TABLE public.video_play_sessions RENAME COLUMN total_watch_time_seconds TO total_watch_seconds;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Índices otimizados OMEGA
CREATE INDEX IF NOT EXISTS idx_vps_user_active_omega 
  ON public.video_play_sessions(user_id) 
  WHERE revoked_at IS NULL AND ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vps_sanctum 
  ON public.video_play_sessions(sanctum_immune) 
  WHERE sanctum_immune = TRUE;

-- ============================================
-- 3. ATUALIZAR video_user_risk_scores (OMEGA)
-- ============================================
DO $$ BEGIN
  ALTER TABLE public.video_user_risk_scores ADD COLUMN IF NOT EXISTS current_score INTEGER DEFAULT 0;
  ALTER TABLE public.video_user_risk_scores ADD COLUMN IF NOT EXISTS max_score_ever INTEGER DEFAULT 0;
  ALTER TABLE public.video_user_risk_scores ADD COLUMN IF NOT EXISTS session_revoke_count INTEGER DEFAULT 0;
  ALTER TABLE public.video_user_risk_scores ADD COLUMN IF NOT EXISTS last_violation_type TEXT NULL;
  ALTER TABLE public.video_user_risk_scores ADD COLUMN IF NOT EXISTS last_decay_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE public.video_user_risk_scores ADD COLUMN IF NOT EXISTS decay_rate_per_day INTEGER DEFAULT 5;
  
  -- Sincronizar current_score com total_risk_score se existir
  UPDATE public.video_user_risk_scores 
  SET current_score = COALESCE(total_risk_score, 0),
      max_score_ever = COALESCE(total_risk_score, 0)
  WHERE current_score = 0 AND total_risk_score IS NOT NULL AND total_risk_score > 0;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Trigger para atualizar max_score_ever
CREATE OR REPLACE FUNCTION update_risk_score_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.current_score > COALESCE(NEW.max_score_ever, 0) THEN
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
-- 4. FUNÇÕES SQL OMEGA
-- ============================================

-- 4.1 Gerar código de sessão (versão OMEGA)
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

-- 4.2 Criar sessão de vídeo OMEGA (com suporte SANCTUM)
CREATE OR REPLACE FUNCTION create_video_session_omega(
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
  expires_at TIMESTAMPTZ,
  sanctum_status TEXT
) AS $$
DECLARE
  v_session_code TEXT;
  v_session_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_session_id UUID;
  v_revoked_count INTEGER;
BEGIN
  -- Revogar sessões anteriores do mesmo usuário
  UPDATE public.video_play_sessions
  SET revoked_at = now(),
      revoke_reason = 'NEW_SESSION'
  WHERE user_id = p_user_id
    AND revoked_at IS NULL
    AND ended_at IS NULL;
  
  GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
  
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
    ip_address,
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
  
  -- Log de autorização
  INSERT INTO public.video_access_logs (
    user_id, session_id, action, lesson_id, provider_video_id, provider, details
  ) VALUES (
    p_user_id, v_session_id, 'authorize', p_lesson_id, p_provider_video_id, p_provider,
    jsonb_build_object(
      'revoked_previous', v_revoked_count,
      'sanctum_immune', p_sanctum_immune,
      'sanctum_bypass_reason', p_sanctum_bypass_reason
    )
  );
  
  RETURN QUERY SELECT 
    v_session_id, 
    v_session_code, 
    v_session_token, 
    v_expires_at,
    CASE WHEN p_sanctum_immune THEN 'IMMUNE' ELSE 'NORMAL' END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3 Heartbeat OMEGA
CREATE OR REPLACE FUNCTION video_session_heartbeat_omega(
  p_session_token TEXT,
  p_position_seconds INTEGER DEFAULT 0
)
RETURNS TABLE(
  success BOOLEAN,
  is_valid BOOLEAN,
  new_expires_at TIMESTAMPTZ,
  message TEXT,
  sanctum_immune BOOLEAN
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
    RETURN QUERY SELECT FALSE, FALSE, NULL::TIMESTAMPTZ, 'SESSION_NOT_FOUND', FALSE;
    RETURN;
  END IF;
  
  -- Sessão revogada
  IF v_session.revoked_at IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, FALSE, NULL::TIMESTAMPTZ, 'SESSION_REVOKED', v_session.sanctum_immune;
    RETURN;
  END IF;
  
  -- Sessão encerrada
  IF v_session.ended_at IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, FALSE, NULL::TIMESTAMPTZ, 'SESSION_ENDED', v_session.sanctum_immune;
    RETURN;
  END IF;
  
  -- Sessão expirada
  IF v_session.expires_at < now() THEN
    RETURN QUERY SELECT FALSE, FALSE, NULL::TIMESTAMPTZ, 'SESSION_EXPIRED', v_session.sanctum_immune;
    RETURN;
  END IF;
  
  -- Atualizar heartbeat e estender expiração
  v_new_expires := now() + interval '5 minutes';
  
  UPDATE public.video_play_sessions
  SET last_heartbeat_at = now(),
      expires_at = v_new_expires,
      heartbeat_count = COALESCE(heartbeat_count, 0) + 1,
      total_watch_time_seconds = GREATEST(COALESCE(total_watch_time_seconds, 0), p_position_seconds)
  WHERE id = v_session.id;
  
  RETURN QUERY SELECT TRUE, TRUE, v_new_expires, 'OK', v_session.sanctum_immune;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.4 Aplicar decay ao risk score
CREATE OR REPLACE FUNCTION apply_risk_score_decay()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.video_user_risk_scores
  SET current_score = GREATEST(0, current_score - decay_rate_per_day),
      last_decay_at = now()
  WHERE last_decay_at < now() - interval '1 day'
    AND current_score > 0;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. GRANTS
-- ============================================
GRANT EXECUTE ON FUNCTION generate_video_session_code() TO authenticated;
GRANT EXECUTE ON FUNCTION create_video_session_omega TO authenticated;
GRANT EXECUTE ON FUNCTION video_session_heartbeat_omega TO authenticated;
GRANT EXECUTE ON FUNCTION apply_risk_score_decay() TO authenticated;

-- ============================================
-- 6. COMENTÁRIOS OMEGA
-- ============================================
COMMENT ON FUNCTION create_video_session_omega IS 'OMEGA: Cria sessão de vídeo com suporte SANCTUM e revogação automática';
COMMENT ON FUNCTION video_session_heartbeat_omega IS 'OMEGA: Heartbeat com tracking de posição e extensão automática';
COMMENT ON FUNCTION apply_risk_score_decay IS 'OMEGA: Aplica decay diário ao risk score dos usuários';
