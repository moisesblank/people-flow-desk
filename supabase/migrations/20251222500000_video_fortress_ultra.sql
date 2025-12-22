-- ============================================
-- 🔥 VIDEO FORTRESS ULTRA v2.0
-- Sistema de Proteção de Vídeos DEFINITIVO
-- Autor: MESTRE (Claude Opus 4.5 PHD)
-- Data: 2024-12-22
-- ============================================

-- ============================================
-- 1. ENUMS
-- ============================================
DO $$ BEGIN
    CREATE TYPE video_session_status AS ENUM ('active', 'expired', 'revoked', 'ended');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE video_violation_type AS ENUM (
        'devtools_open',
        'screenshot_attempt',
        'screen_recording',
        'multiple_sessions',
        'invalid_domain',
        'expired_token',
        'keyboard_shortcut',
        'context_menu',
        'drag_attempt',
        'copy_attempt',
        'visibility_abuse',
        'iframe_manipulation',
        'network_tampering',
        'unknown'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE video_action_type AS ENUM (
        'authorize',
        'play_start',
        'play_resume',
        'pause',
        'seek',
        'quality_change',
        'speed_change',
        'heartbeat',
        'buffer_start',
        'buffer_end',
        'complete',
        'error',
        'violation'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. TABELA: video_play_sessions
-- Sessões de playback (anti-compartilhamento + rastreio)
-- ============================================
CREATE TABLE IF NOT EXISTS public.video_play_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identificação do conteúdo
    lesson_id UUID NULL,
    course_id UUID NULL,
    provider TEXT NOT NULL DEFAULT 'panda',
    provider_video_id TEXT NOT NULL,
    
    -- Sessão/forense
    session_code TEXT NOT NULL UNIQUE,
    session_token TEXT NOT NULL UNIQUE,
    watermark_text TEXT NOT NULL,
    watermark_hash TEXT NOT NULL,
    
    -- Status e timing
    status video_session_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    revoke_reason TEXT NULL,
    ended_at TIMESTAMPTZ NULL,
    
    -- Métricas de watch
    total_watch_time_seconds INTEGER DEFAULT 0,
    max_position_seconds INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Telemetria
    ip_address INET NULL,
    user_agent TEXT NULL,
    device_fingerprint TEXT NULL,
    country_code TEXT NULL,
    
    -- Risk score
    risk_score INTEGER DEFAULT 0,
    violation_count INTEGER DEFAULT 0
);

-- Índices otimizados
CREATE INDEX IF NOT EXISTS idx_vps_user_id ON public.video_play_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_vps_lesson_id ON public.video_play_sessions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vps_provider_video ON public.video_play_sessions(provider, provider_video_id);
CREATE INDEX IF NOT EXISTS idx_vps_status ON public.video_play_sessions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vps_active_user ON public.video_play_sessions(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vps_session_token ON public.video_play_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_vps_expires ON public.video_play_sessions(expires_at) WHERE status = 'active';

-- ============================================
-- 3. TABELA: video_access_logs
-- Logs de acesso detalhados (auditoria completa)
-- ============================================
CREATE TABLE IF NOT EXISTS public.video_access_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.video_play_sessions(id) ON DELETE SET NULL,
    
    -- Ação
    action video_action_type NOT NULL,
    
    -- Contexto do vídeo
    lesson_id UUID NULL,
    course_id UUID NULL,
    provider TEXT NULL,
    provider_video_id TEXT NULL,
    
    -- Posição e timing
    position_seconds INTEGER NULL,
    duration_seconds INTEGER NULL,
    
    -- Telemetria
    ip_address INET NULL,
    user_agent TEXT NULL,
    device_fingerprint TEXT NULL,
    
    -- Detalhes extras (JSON)
    details JSONB NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_val_user_time ON public.video_access_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_val_session ON public.video_access_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_val_action ON public.video_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_val_lesson ON public.video_access_logs(lesson_id, created_at DESC);

-- ============================================
-- 4. TABELA: video_violations
-- Registro de violações de segurança
-- ============================================
CREATE TABLE IF NOT EXISTS public.video_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.video_play_sessions(id) ON DELETE SET NULL,
    
    -- Tipo de violação
    violation_type video_violation_type NOT NULL,
    severity INTEGER NOT NULL DEFAULT 1, -- 1-10
    
    -- Contexto
    lesson_id UUID NULL,
    provider_video_id TEXT NULL,
    
    -- Detalhes
    details JSONB NULL,
    key_pressed TEXT NULL,
    element_targeted TEXT NULL,
    
    -- Resposta
    action_taken TEXT NULL, -- 'warned', 'paused', 'revoked', 'banned'
    
    -- Telemetria
    ip_address INET NULL,
    user_agent TEXT NULL,
    device_fingerprint TEXT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vv_user ON public.video_violations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vv_session ON public.video_violations(session_id);
CREATE INDEX IF NOT EXISTS idx_vv_type ON public.video_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_vv_severity ON public.video_violations(severity) WHERE severity >= 5;

-- ============================================
-- 5. TABELA: video_user_risk_scores
-- Score de risco acumulado por usuário
-- ============================================
CREATE TABLE IF NOT EXISTS public.video_user_risk_scores (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Scores
    total_risk_score INTEGER DEFAULT 0,
    current_risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical', 'banned'
    
    -- Contadores
    total_violations INTEGER DEFAULT 0,
    violations_last_24h INTEGER DEFAULT 0,
    violations_last_7d INTEGER DEFAULT 0,
    
    -- Ações tomadas
    warnings_count INTEGER DEFAULT 0,
    sessions_revoked_count INTEGER DEFAULT 0,
    temporary_bans_count INTEGER DEFAULT 0,
    
    -- Status
    is_banned BOOLEAN DEFAULT FALSE,
    banned_at TIMESTAMPTZ NULL,
    banned_until TIMESTAMPTZ NULL,
    ban_reason TEXT NULL,
    
    -- Metadata
    first_violation_at TIMESTAMPTZ NULL,
    last_violation_at TIMESTAMPTZ NULL,
    last_calculated_at TIMESTAMPTZ DEFAULT now(),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 6. TABELA: video_domain_whitelist
-- Domínios autorizados para embed
-- ============================================
CREATE TABLE IF NOT EXISTS public.video_domain_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Inserir domínios autorizados
INSERT INTO public.video_domain_whitelist (domain, description) VALUES 
    ('gestao.moisesmedeiros.com.br', 'Domínio principal de gestão'),
    ('www.moisesmedeiros.com.br', 'Domínio principal público'),
    ('pro.moisesmedeiros.com.br', 'Portal do aluno'),
    ('localhost', 'Desenvolvimento local'),
    ('localhost:5173', 'Vite dev server'),
    ('localhost:3000', 'Dev server alternativo')
ON CONFLICT (domain) DO NOTHING;

-- ============================================
-- 7. FUNÇÕES SQL
-- ============================================

-- 7.1 Gerar código de sessão único
CREATE OR REPLACE FUNCTION public.generate_session_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_code TEXT;
    v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    v_i INTEGER;
BEGIN
    v_code := 'MM-';
    FOR v_i IN 1..4 LOOP
        v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    END LOOP;
    RETURN v_code;
END;
$$;

-- 7.2 Criar sessão de vídeo (com revogação de sessões anteriores)
CREATE OR REPLACE FUNCTION public.create_video_session(
    p_user_id UUID,
    p_lesson_id UUID DEFAULT NULL,
    p_course_id UUID DEFAULT NULL,
    p_provider TEXT DEFAULT 'panda',
    p_provider_video_id TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_device_fingerprint TEXT DEFAULT NULL,
    p_ttl_minutes INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
    v_session_code TEXT;
    v_session_token TEXT;
    v_watermark_text TEXT;
    v_watermark_hash TEXT;
    v_user_name TEXT;
    v_user_cpf TEXT;
    v_expires_at TIMESTAMPTZ;
    v_is_banned BOOLEAN;
    v_revoked_count INTEGER := 0;
BEGIN
    -- Verificar se usuário está banido
    SELECT is_banned INTO v_is_banned
    FROM public.video_user_risk_scores
    WHERE user_id = p_user_id;
    
    IF v_is_banned = TRUE THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'USER_BANNED',
            'message', 'Acesso ao vídeo bloqueado por violações de segurança'
        );
    END IF;
    
    -- Revogar sessões ativas anteriores do mesmo usuário
    UPDATE public.video_play_sessions
    SET 
        status = 'revoked',
        revoked_at = now(),
        revoke_reason = 'NEW_SESSION'
    WHERE user_id = p_user_id 
      AND status = 'active';
    
    GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
    
    -- Buscar dados do usuário para watermark
    SELECT 
        COALESCE(p.nome, p.nome_completo, 'Aluno'),
        COALESCE(p.cpf, '')
    INTO v_user_name, v_user_cpf
    FROM public.profiles p
    WHERE p.id = p_user_id;
    
    -- Gerar códigos
    v_session_code := public.generate_session_code();
    v_session_token := encode(gen_random_bytes(32), 'hex');
    v_expires_at := now() + (p_ttl_minutes || ' minutes')::interval;
    
    -- Formatar CPF para watermark (parcial por segurança visual)
    IF length(v_user_cpf) >= 11 THEN
        v_user_cpf := '***.' || substr(v_user_cpf, 4, 3) || '.' || substr(v_user_cpf, 7, 3) || '-**';
    END IF;
    
    -- Criar texto da watermark
    v_watermark_text := upper(v_user_name) || ' • ' || v_user_cpf || ' • ' || v_session_code;
    v_watermark_hash := encode(sha256(v_watermark_text::bytea), 'hex');
    
    -- Criar nova sessão
    INSERT INTO public.video_play_sessions (
        user_id,
        lesson_id,
        course_id,
        provider,
        provider_video_id,
        session_code,
        session_token,
        watermark_text,
        watermark_hash,
        expires_at,
        ip_address,
        user_agent,
        device_fingerprint
    ) VALUES (
        p_user_id,
        p_lesson_id,
        p_course_id,
        p_provider,
        p_provider_video_id,
        v_session_code,
        v_session_token,
        v_watermark_text,
        v_watermark_hash,
        v_expires_at,
        p_ip_address,
        p_user_agent,
        p_device_fingerprint
    ) RETURNING id INTO v_session_id;
    
    -- Log da autorização
    INSERT INTO public.video_access_logs (
        user_id,
        session_id,
        action,
        lesson_id,
        course_id,
        provider,
        provider_video_id,
        ip_address,
        user_agent,
        device_fingerprint,
        details
    ) VALUES (
        p_user_id,
        v_session_id,
        'authorize',
        p_lesson_id,
        p_course_id,
        p_provider,
        p_provider_video_id,
        p_ip_address,
        p_user_agent,
        p_device_fingerprint,
        jsonb_build_object(
            'revoked_previous', v_revoked_count,
            'ttl_minutes', p_ttl_minutes
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'session_id', v_session_id,
        'session_code', v_session_code,
        'session_token', v_session_token,
        'expires_at', v_expires_at,
        'watermark', jsonb_build_object(
            'text', v_watermark_text,
            'hash', left(v_watermark_hash, 8),
            'mode', 'moving'
        ),
        'revoked_previous', v_revoked_count
    );
END;
$$;

-- 7.3 Heartbeat de sessão
CREATE OR REPLACE FUNCTION public.video_session_heartbeat(
    p_session_token TEXT,
    p_position_seconds INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_now TIMESTAMPTZ := now();
BEGIN
    -- Buscar e validar sessão
    SELECT * INTO v_session
    FROM public.video_play_sessions
    WHERE session_token = p_session_token;
    
    IF v_session IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'SESSION_NOT_FOUND'
        );
    END IF;
    
    IF v_session.status = 'revoked' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'SESSION_REVOKED',
            'reason', v_session.revoke_reason
        );
    END IF;
    
    IF v_session.status = 'expired' OR v_session.expires_at < v_now THEN
        -- Marcar como expirada
        UPDATE public.video_play_sessions
        SET status = 'expired'
        WHERE id = v_session.id AND status = 'active';
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'SESSION_EXPIRED'
        );
    END IF;
    
    -- Atualizar heartbeat e posição
    UPDATE public.video_play_sessions
    SET 
        last_heartbeat_at = v_now,
        max_position_seconds = GREATEST(COALESCE(max_position_seconds, 0), COALESCE(p_position_seconds, 0)),
        total_watch_time_seconds = total_watch_time_seconds + 30 -- Heartbeat a cada 30s
    WHERE id = v_session.id;
    
    -- Estender expiração se heartbeat regular
    IF v_session.expires_at - v_now < interval '2 minutes' THEN
        UPDATE public.video_play_sessions
        SET expires_at = v_now + interval '5 minutes'
        WHERE id = v_session.id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'session_id', v_session.id,
        'expires_at', v_session.expires_at,
        'status', 'active'
    );
END;
$$;

-- 7.4 Registrar violação (SANCTUM 2.0 - DETECÇÃO ≠ PUNIÇÃO)
-- Thresholds mais altos, ações graduais
CREATE OR REPLACE FUNCTION public.register_video_violation(
    p_session_token TEXT,
    p_violation_type video_violation_type,
    p_severity INTEGER DEFAULT 1,
    p_details JSONB DEFAULT NULL,
    p_key_pressed TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_user_role TEXT;
    v_new_risk_score INTEGER;
    v_action_taken TEXT := 'none';
    v_should_revoke BOOLEAN := FALSE;
    v_is_immune BOOLEAN := FALSE;
BEGIN
    -- Buscar sessão
    SELECT * INTO v_session
    FROM public.video_play_sessions
    WHERE session_token = p_session_token;
    
    IF v_session IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'SESSION_NOT_FOUND');
    END IF;
    
    -- 🛡️ SANCTUM: Verificar se usuário é imune
    SELECT role INTO v_user_role
    FROM public.profiles
    WHERE id = v_session.user_id;
    
    v_is_immune := v_user_role IN ('owner', 'admin', 'funcionario', 'suporte', 'coordenacao');
    
    -- 🛡️ SANCTUM: Usuários imunes = apenas log, sem score
    IF v_is_immune THEN
        -- Apenas registrar para auditoria, sem impacto
        INSERT INTO public.video_access_logs (
            user_id, session_id, action, lesson_id, provider_video_id, ip_address, user_agent,
            details
        ) VALUES (
            v_session.user_id, v_session.id, 'violation', v_session.lesson_id, v_session.provider_video_id,
            p_ip_address, p_user_agent,
            jsonb_build_object('type', p_violation_type, 'severity', p_severity, 'sanctum_bypass', true, 'role', v_user_role)
        );
        
        RETURN jsonb_build_object(
            'success', true,
            'action_taken', 'none',
            'session_revoked', false,
            'new_risk_score', 0,
            'sanctum_bypass', true
        );
    END IF;
    
    -- Calcular novo risk score (incremento mais suave)
    v_new_risk_score := v_session.risk_score + (p_severity * 5); -- Era *10, agora *5
    
    -- 🛡️ SANCTUM: Thresholds MUITO mais altos para ações
    -- warn: score >= 30 (antes era implícito)
    -- degrade: score >= 60
    -- pause: score >= 100 (antes era 50)
    -- revoke: score >= 200 E severidade >= 9 (antes era 100)
    IF v_new_risk_score >= 200 AND p_severity >= 9 THEN
        v_action_taken := 'revoke';
        v_should_revoke := TRUE;
    ELSIF v_new_risk_score >= 100 THEN
        v_action_taken := 'pause';
    ELSIF v_new_risk_score >= 60 THEN
        v_action_taken := 'degrade';
    ELSIF v_new_risk_score >= 30 THEN
        v_action_taken := 'warn';
    ELSE
        v_action_taken := 'none'; -- Score baixo = sem ação
    END IF;
    
    -- Registrar violação
    INSERT INTO public.video_violations (
        user_id,
        session_id,
        violation_type,
        severity,
        lesson_id,
        provider_video_id,
        details,
        key_pressed,
        action_taken,
        ip_address,
        user_agent
    ) VALUES (
        v_session.user_id,
        v_session.id,
        p_violation_type,
        p_severity,
        v_session.lesson_id,
        v_session.provider_video_id,
        p_details,
        p_key_pressed,
        v_action_taken,
        p_ip_address,
        p_user_agent
    );
    
    -- Atualizar sessão (só revoga se v_should_revoke = true)
    UPDATE public.video_play_sessions
    SET 
        risk_score = v_new_risk_score,
        violation_count = violation_count + 1,
        status = CASE WHEN v_should_revoke THEN 'revoked'::video_session_status ELSE status END,
        revoked_at = CASE WHEN v_should_revoke THEN now() ELSE revoked_at END,
        revoke_reason = CASE WHEN v_should_revoke THEN 'SECURITY_VIOLATION_CONFIRMED' ELSE revoke_reason END
    WHERE id = v_session.id;
    
    -- Atualizar risk score do usuário (thresholds mais altos)
    INSERT INTO public.video_user_risk_scores (user_id, total_risk_score, total_violations, last_violation_at, first_violation_at)
    VALUES (v_session.user_id, p_severity * 5, 1, now(), now())
    ON CONFLICT (user_id) DO UPDATE SET
        total_risk_score = video_user_risk_scores.total_risk_score + (p_severity * 5),
        total_violations = video_user_risk_scores.total_violations + 1,
        violations_last_24h = video_user_risk_scores.violations_last_24h + 1,
        last_violation_at = now(),
        -- 🛡️ SANCTUM: Thresholds de nível muito mais altos
        current_risk_level = CASE 
            WHEN video_user_risk_scores.total_risk_score + (p_severity * 5) >= 1000 THEN 'critical'
            WHEN video_user_risk_scores.total_risk_score + (p_severity * 5) >= 500 THEN 'high'
            WHEN video_user_risk_scores.total_risk_score + (p_severity * 5) >= 200 THEN 'medium'
            ELSE 'low'
        END,
        updated_at = now();
    
    -- Log
    INSERT INTO public.video_access_logs (
        user_id, session_id, action, lesson_id, provider_video_id, ip_address, user_agent,
        details
    ) VALUES (
        v_session.user_id, v_session.id, 'violation', v_session.lesson_id, v_session.provider_video_id,
        p_ip_address, p_user_agent,
        jsonb_build_object('type', p_violation_type, 'severity', p_severity, 'action', v_action_taken, 'score', v_new_risk_score)
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'action_taken', v_action_taken,
        'session_revoked', v_should_revoke,
        'new_risk_score', v_new_risk_score
    );
END;
$$;

-- 7.5 Verificar domínio autorizado
CREATE OR REPLACE FUNCTION public.is_domain_authorized(p_domain TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.video_domain_whitelist
        WHERE domain = p_domain AND is_active = TRUE
    );
END;
$$;

-- 7.6 Finalizar sessão
CREATE OR REPLACE FUNCTION public.end_video_session(
    p_session_token TEXT,
    p_final_position INTEGER DEFAULT NULL,
    p_completion_percentage DECIMAL DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
BEGIN
    SELECT * INTO v_session
    FROM public.video_play_sessions
    WHERE session_token = p_session_token AND status = 'active';
    
    IF v_session IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'SESSION_NOT_FOUND');
    END IF;
    
    UPDATE public.video_play_sessions
    SET 
        status = 'ended',
        ended_at = now(),
        max_position_seconds = GREATEST(COALESCE(max_position_seconds, 0), COALESCE(p_final_position, 0)),
        completion_percentage = COALESCE(p_completion_percentage, completion_percentage)
    WHERE id = v_session.id;
    
    INSERT INTO public.video_access_logs (
        user_id, session_id, action, lesson_id, position_seconds, details
    ) VALUES (
        v_session.user_id, v_session.id, 'complete', v_session.lesson_id, p_final_position,
        jsonb_build_object('completion', p_completion_percentage, 'total_watch_time', v_session.total_watch_time_seconds)
    );
    
    RETURN jsonb_build_object('success', true, 'session_ended', true);
END;
$$;

-- 7.7 Cleanup de sessões expiradas (rodar via cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_video_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.video_play_sessions
    SET status = 'expired'
    WHERE status = 'active' 
      AND (expires_at < now() OR last_heartbeat_at < now() - interval '2 minutes');
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- ============================================
-- 8. RLS POLICIES
-- ============================================

-- Habilitar RLS
ALTER TABLE public.video_play_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_user_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_domain_whitelist ENABLE ROW LEVEL SECURITY;

-- Remover policies existentes
DROP POLICY IF EXISTS "vps_user_select" ON public.video_play_sessions;
DROP POLICY IF EXISTS "vps_service_all" ON public.video_play_sessions;
DROP POLICY IF EXISTS "val_user_select" ON public.video_access_logs;
DROP POLICY IF EXISTS "val_service_insert" ON public.video_access_logs;
DROP POLICY IF EXISTS "vv_user_select" ON public.video_violations;
DROP POLICY IF EXISTS "vv_service_insert" ON public.video_violations;
DROP POLICY IF EXISTS "vurs_user_select" ON public.video_user_risk_scores;
DROP POLICY IF EXISTS "vdw_public_select" ON public.video_domain_whitelist;
DROP POLICY IF EXISTS "vdw_admin_all" ON public.video_domain_whitelist;

-- video_play_sessions: usuário vê apenas as suas
CREATE POLICY "vps_user_select" ON public.video_play_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- video_play_sessions: service role pode tudo
CREATE POLICY "vps_service_all" ON public.video_play_sessions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- video_access_logs: usuário vê apenas os seus
CREATE POLICY "val_user_select" ON public.video_access_logs
    FOR SELECT USING (auth.uid() = user_id);

-- video_access_logs: insert via functions (service)
CREATE POLICY "val_service_insert" ON public.video_access_logs
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() = user_id);

-- video_violations: usuário vê apenas as suas
CREATE POLICY "vv_user_select" ON public.video_violations
    FOR SELECT USING (auth.uid() = user_id);

-- video_violations: insert via functions
CREATE POLICY "vv_service_insert" ON public.video_violations
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- video_user_risk_scores: usuário vê apenas o seu
CREATE POLICY "vurs_user_select" ON public.video_user_risk_scores
    FOR SELECT USING (auth.uid() = user_id);

-- video_domain_whitelist: leitura pública
CREATE POLICY "vdw_public_select" ON public.video_domain_whitelist
    FOR SELECT USING (true);

-- video_domain_whitelist: admin pode modificar
CREATE POLICY "vdw_admin_all" ON public.video_domain_whitelist
    FOR ALL USING (public.is_admin());

-- ============================================
-- 9. TRIGGERS
-- ============================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_video_risk_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_video_risk_updated ON public.video_user_risk_scores;
CREATE TRIGGER tr_video_risk_updated
    BEFORE UPDATE ON public.video_user_risk_scores
    FOR EACH ROW
    EXECUTE FUNCTION public.update_video_risk_timestamp();

-- ============================================
-- 10. GRANTS
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.video_play_sessions TO authenticated;
GRANT SELECT ON public.video_access_logs TO authenticated;
GRANT SELECT ON public.video_violations TO authenticated;
GRANT SELECT ON public.video_user_risk_scores TO authenticated;
GRANT SELECT ON public.video_domain_whitelist TO authenticated;

GRANT EXECUTE ON FUNCTION public.generate_session_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_video_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.video_session_heartbeat TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_video_violation TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_domain_authorized TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_video_session TO authenticated;

-- ============================================
-- 11. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.video_play_sessions IS 'Sessões de playback de vídeo - anti-compartilhamento e rastreio';
COMMENT ON TABLE public.video_access_logs IS 'Logs detalhados de acesso a vídeos - auditoria completa';
COMMENT ON TABLE public.video_violations IS 'Registro de violações de segurança de vídeo';
COMMENT ON TABLE public.video_user_risk_scores IS 'Score de risco acumulado por usuário';
COMMENT ON TABLE public.video_domain_whitelist IS 'Domínios autorizados para embed de vídeos';

COMMENT ON FUNCTION public.create_video_session IS 'Cria sessão de vídeo com revogação automática de sessões anteriores';
COMMENT ON FUNCTION public.video_session_heartbeat IS 'Heartbeat para manter sessão viva e validar acesso';
COMMENT ON FUNCTION public.register_video_violation IS 'Registra violação de segurança e calcula ações';

-- FIM DA MIGRAÇÃO
