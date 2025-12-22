-- ============================================
-- 🔥 VIDEO FORTRESS ULTRA v2.0 (CORRIGIDO)
-- ============================================

-- 1. ENUMS
DO $$ BEGIN CREATE TYPE public.video_session_status AS ENUM ('active', 'expired', 'revoked', 'ended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.video_violation_type AS ENUM ('devtools_open', 'screenshot_attempt', 'screen_recording', 'multiple_sessions', 'invalid_domain', 'expired_token', 'keyboard_shortcut', 'context_menu', 'drag_attempt', 'copy_attempt', 'visibility_abuse', 'iframe_manipulation', 'network_tampering', 'unknown'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.video_action_type AS ENUM ('authorize', 'play_start', 'play_resume', 'pause', 'seek', 'quality_change', 'speed_change', 'heartbeat', 'buffer_start', 'buffer_end', 'complete', 'error', 'violation'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. TABELAS
CREATE TABLE IF NOT EXISTS public.video_play_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID NULL, course_id UUID NULL,
    provider TEXT NOT NULL DEFAULT 'panda', provider_video_id TEXT NOT NULL,
    session_code TEXT NOT NULL UNIQUE, session_token TEXT NOT NULL UNIQUE,
    watermark_text TEXT NOT NULL, watermark_hash TEXT NOT NULL,
    status public.video_session_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ NULL, revoke_reason TEXT NULL, ended_at TIMESTAMPTZ NULL,
    total_watch_time_seconds INTEGER DEFAULT 0, max_position_seconds INTEGER DEFAULT 0, completion_percentage DECIMAL(5,2) DEFAULT 0,
    ip_address INET NULL, user_agent TEXT NULL, device_fingerprint TEXT NULL, country_code TEXT NULL,
    risk_score INTEGER DEFAULT 0, violation_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.video_access_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.video_play_sessions(id) ON DELETE SET NULL,
    action public.video_action_type NOT NULL,
    lesson_id UUID NULL, course_id UUID NULL, provider TEXT NULL, provider_video_id TEXT NULL,
    position_seconds INTEGER NULL, duration_seconds INTEGER NULL,
    ip_address INET NULL, user_agent TEXT NULL, device_fingerprint TEXT NULL,
    details JSONB NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.video_play_sessions(id) ON DELETE SET NULL,
    violation_type public.video_violation_type NOT NULL, severity INTEGER NOT NULL DEFAULT 1,
    lesson_id UUID NULL, provider_video_id TEXT NULL, details JSONB NULL,
    key_pressed TEXT NULL, element_targeted TEXT NULL, action_taken TEXT NULL,
    ip_address INET NULL, user_agent TEXT NULL, device_fingerprint TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_user_risk_scores (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_risk_score INTEGER DEFAULT 0, current_risk_level TEXT DEFAULT 'low',
    total_violations INTEGER DEFAULT 0, violations_last_24h INTEGER DEFAULT 0, violations_last_7d INTEGER DEFAULT 0,
    warnings_count INTEGER DEFAULT 0, sessions_revoked_count INTEGER DEFAULT 0, temporary_bans_count INTEGER DEFAULT 0,
    is_banned BOOLEAN DEFAULT FALSE, banned_at TIMESTAMPTZ NULL, banned_until TIMESTAMPTZ NULL, ban_reason TEXT NULL,
    first_violation_at TIMESTAMPTZ NULL, last_violation_at TIMESTAMPTZ NULL, last_calculated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_domain_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL UNIQUE, is_active BOOLEAN DEFAULT TRUE, description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_by UUID REFERENCES auth.users(id)
);

-- 3. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_vps_user_id ON public.video_play_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_vps_lesson_id ON public.video_play_sessions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vps_session_token ON public.video_play_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_val_user_time ON public.video_access_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_val_session ON public.video_access_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_vv_user ON public.video_violations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vv_session ON public.video_violations(session_id);

-- 4. DOMÍNIOS WHITELIST
INSERT INTO public.video_domain_whitelist (domain, description) VALUES 
    ('gestao.moisesmedeiros.com.br', 'Gestão'),
    ('www.moisesmedeiros.com.br', 'Site principal'),
    ('pro.moisesmedeiros.com.br', 'Portal aluno'),
    ('localhost', 'Dev'), ('localhost:5173', 'Vite')
ON CONFLICT (domain) DO NOTHING;

-- 5. FUNÇÕES
CREATE OR REPLACE FUNCTION public.generate_video_session_code()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_code TEXT; v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
BEGIN v_code := 'MM-'; FOR v_i IN 1..4 LOOP v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1); END LOOP; RETURN v_code; END; $$;

CREATE OR REPLACE FUNCTION public.create_video_session(p_user_id UUID, p_lesson_id UUID DEFAULT NULL, p_course_id UUID DEFAULT NULL, p_provider TEXT DEFAULT 'panda', p_provider_video_id TEXT DEFAULT NULL, p_ip_address INET DEFAULT NULL, p_user_agent TEXT DEFAULT NULL, p_device_fingerprint TEXT DEFAULT NULL, p_ttl_minutes INTEGER DEFAULT 5)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_session_id UUID; v_session_code TEXT; v_session_token TEXT; v_watermark_text TEXT; v_watermark_hash TEXT; v_user_name TEXT; v_user_cpf TEXT; v_expires_at TIMESTAMPTZ; v_is_banned BOOLEAN; v_revoked_count INTEGER := 0;
BEGIN
    SELECT is_banned INTO v_is_banned FROM public.video_user_risk_scores WHERE user_id = p_user_id;
    IF v_is_banned = TRUE THEN RETURN jsonb_build_object('success', false, 'error', 'USER_BANNED'); END IF;
    UPDATE public.video_play_sessions SET status = 'revoked', revoked_at = now(), revoke_reason = 'NEW_SESSION' WHERE user_id = p_user_id AND status = 'active';
    GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
    SELECT COALESCE(p.nome, 'Aluno'), COALESCE(p.cpf, '') INTO v_user_name, v_user_cpf FROM public.profiles p WHERE p.id = p_user_id;
    v_session_code := public.generate_video_session_code(); v_session_token := encode(gen_random_bytes(32), 'hex'); v_expires_at := now() + (p_ttl_minutes || ' minutes')::interval;
    IF length(v_user_cpf) >= 11 THEN v_user_cpf := '***.' || substr(v_user_cpf, 4, 3) || '.' || substr(v_user_cpf, 7, 3) || '-**'; END IF;
    v_watermark_text := upper(v_user_name) || ' • ' || v_user_cpf || ' • ' || v_session_code; v_watermark_hash := encode(sha256(v_watermark_text::bytea), 'hex');
    INSERT INTO public.video_play_sessions (user_id, lesson_id, course_id, provider, provider_video_id, session_code, session_token, watermark_text, watermark_hash, expires_at, ip_address, user_agent, device_fingerprint)
    VALUES (p_user_id, p_lesson_id, p_course_id, p_provider, p_provider_video_id, v_session_code, v_session_token, v_watermark_text, v_watermark_hash, v_expires_at, p_ip_address, p_user_agent, p_device_fingerprint) RETURNING id INTO v_session_id;
    INSERT INTO public.video_access_logs (user_id, session_id, action, lesson_id, course_id, provider, provider_video_id, ip_address, user_agent, device_fingerprint, details)
    VALUES (p_user_id, v_session_id, 'authorize', p_lesson_id, p_course_id, p_provider, p_provider_video_id, p_ip_address, p_user_agent, p_device_fingerprint, jsonb_build_object('revoked_previous', v_revoked_count));
    RETURN jsonb_build_object('success', true, 'session_id', v_session_id, 'session_code', v_session_code, 'session_token', v_session_token, 'expires_at', v_expires_at, 'watermark', jsonb_build_object('text', v_watermark_text, 'hash', left(v_watermark_hash, 8)));
END; $$;

CREATE OR REPLACE FUNCTION public.video_session_heartbeat(p_session_token TEXT, p_position_seconds INTEGER DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_session RECORD; v_now TIMESTAMPTZ := now();
BEGIN
    SELECT * INTO v_session FROM public.video_play_sessions WHERE session_token = p_session_token;
    IF v_session IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'SESSION_NOT_FOUND'); END IF;
    IF v_session.status = 'revoked' THEN RETURN jsonb_build_object('success', false, 'error', 'SESSION_REVOKED'); END IF;
    IF v_session.status = 'expired' OR v_session.expires_at < v_now THEN UPDATE public.video_play_sessions SET status = 'expired' WHERE id = v_session.id; RETURN jsonb_build_object('success', false, 'error', 'SESSION_EXPIRED'); END IF;
    UPDATE public.video_play_sessions SET last_heartbeat_at = v_now, max_position_seconds = GREATEST(COALESCE(max_position_seconds, 0), COALESCE(p_position_seconds, 0)), total_watch_time_seconds = total_watch_time_seconds + 30, expires_at = CASE WHEN expires_at - v_now < interval '2 minutes' THEN v_now + interval '5 minutes' ELSE expires_at END WHERE id = v_session.id;
    RETURN jsonb_build_object('success', true, 'session_id', v_session.id, 'status', 'active');
END; $$;

CREATE OR REPLACE FUNCTION public.register_video_violation(p_session_token TEXT, p_violation_type public.video_violation_type, p_severity INTEGER DEFAULT 1, p_details JSONB DEFAULT NULL, p_key_pressed TEXT DEFAULT NULL, p_ip_address INET DEFAULT NULL, p_user_agent TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_session RECORD; v_user_role TEXT; v_new_risk_score INTEGER; v_action_taken TEXT := 'none'; v_should_revoke BOOLEAN := FALSE;
BEGIN
    SELECT * INTO v_session FROM public.video_play_sessions WHERE session_token = p_session_token;
    IF v_session IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'SESSION_NOT_FOUND'); END IF;
    SELECT role::TEXT INTO v_user_role FROM public.user_roles WHERE user_id = v_session.user_id LIMIT 1;
    IF v_user_role IN ('owner', 'admin', 'funcionario', 'coordenacao') THEN RETURN jsonb_build_object('success', true, 'action_taken', 'none', 'sanctum_bypass', true); END IF;
    v_new_risk_score := v_session.risk_score + (p_severity * 5);
    IF v_new_risk_score >= 200 AND p_severity >= 9 THEN v_action_taken := 'revoke'; v_should_revoke := TRUE;
    ELSIF v_new_risk_score >= 100 THEN v_action_taken := 'pause';
    ELSIF v_new_risk_score >= 60 THEN v_action_taken := 'degrade';
    ELSIF v_new_risk_score >= 30 THEN v_action_taken := 'warn'; END IF;
    INSERT INTO public.video_violations (user_id, session_id, violation_type, severity, lesson_id, provider_video_id, details, key_pressed, action_taken, ip_address, user_agent) VALUES (v_session.user_id, v_session.id, p_violation_type, p_severity, v_session.lesson_id, v_session.provider_video_id, p_details, p_key_pressed, v_action_taken, p_ip_address, p_user_agent);
    UPDATE public.video_play_sessions SET risk_score = v_new_risk_score, violation_count = violation_count + 1, status = CASE WHEN v_should_revoke THEN 'revoked'::public.video_session_status ELSE status END, revoked_at = CASE WHEN v_should_revoke THEN now() ELSE revoked_at END WHERE id = v_session.id;
    RETURN jsonb_build_object('success', true, 'action_taken', v_action_taken, 'session_revoked', v_should_revoke, 'new_risk_score', v_new_risk_score);
END; $$;

CREATE OR REPLACE FUNCTION public.end_video_session(p_session_token TEXT, p_final_position INTEGER DEFAULT NULL, p_completion_percentage DECIMAL DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_session RECORD;
BEGIN
    SELECT * INTO v_session FROM public.video_play_sessions WHERE session_token = p_session_token AND status = 'active';
    IF v_session IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'SESSION_NOT_FOUND'); END IF;
    UPDATE public.video_play_sessions SET status = 'ended', ended_at = now(), max_position_seconds = GREATEST(COALESCE(max_position_seconds, 0), COALESCE(p_final_position, 0)), completion_percentage = COALESCE(p_completion_percentage, completion_percentage) WHERE id = v_session.id;
    RETURN jsonb_build_object('success', true, 'session_ended', true);
END; $$;

CREATE OR REPLACE FUNCTION public.is_video_domain_authorized(p_domain TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM public.video_domain_whitelist WHERE domain = p_domain AND is_active = TRUE); END; $$;

-- 6. RLS
ALTER TABLE public.video_play_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_user_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_domain_whitelist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vps_user_select" ON public.video_play_sessions;
DROP POLICY IF EXISTS "val_user_select" ON public.video_access_logs;
DROP POLICY IF EXISTS "vv_user_select" ON public.video_violations;
DROP POLICY IF EXISTS "vurs_user_select" ON public.video_user_risk_scores;
DROP POLICY IF EXISTS "vdw_public_select" ON public.video_domain_whitelist;

CREATE POLICY "vps_user_select" ON public.video_play_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "val_user_select" ON public.video_access_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vv_user_select" ON public.video_violations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vurs_user_select" ON public.video_user_risk_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vdw_public_select" ON public.video_domain_whitelist FOR SELECT USING (true);

-- 7. GRANTS
GRANT SELECT ON public.video_play_sessions TO authenticated;
GRANT SELECT ON public.video_access_logs TO authenticated;
GRANT SELECT ON public.video_violations TO authenticated;
GRANT SELECT ON public.video_user_risk_scores TO authenticated;
GRANT SELECT ON public.video_domain_whitelist TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_video_session_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_video_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.video_session_heartbeat TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_video_violation TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_video_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_video_domain_authorized TO authenticated;