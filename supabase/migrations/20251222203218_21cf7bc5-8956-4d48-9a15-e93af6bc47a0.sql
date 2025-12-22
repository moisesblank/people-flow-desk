-- ============================================================
-- 🔥 VIDEO FORTRESS ULTRA v2.0 - PARTE 2
-- Logs, Violações, Risk Scores e Funções Core
-- ============================================================

-- 3. TABELA: video_access_logs
CREATE TABLE IF NOT EXISTS public.video_access_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.video_play_sessions(id) ON DELETE SET NULL,
    
    -- Ação (usando TEXT para compatibilidade)
    action TEXT NOT NULL,
    
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

-- 4. TABELA: video_violations
CREATE TABLE IF NOT EXISTS public.video_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.video_play_sessions(id) ON DELETE SET NULL,
    
    -- Tipo de violação (usando TEXT)
    violation_type TEXT NOT NULL,
    severity INTEGER NOT NULL DEFAULT 1,
    
    -- Contexto
    lesson_id UUID NULL,
    provider_video_id TEXT NULL,
    
    -- Detalhes
    details JSONB NULL,
    key_pressed TEXT NULL,
    element_targeted TEXT NULL,
    
    -- Resposta
    action_taken TEXT NULL,
    
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

-- 5. TABELA: video_user_risk_scores
CREATE TABLE IF NOT EXISTS public.video_user_risk_scores (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Scores
    total_risk_score INTEGER DEFAULT 0,
    current_risk_level TEXT DEFAULT 'low',
    
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

-- 6. TABELA: video_domain_whitelist
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

-- RLS para novas tabelas
ALTER TABLE public.video_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_user_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_domain_whitelist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "video_logs_access" ON public.video_access_logs;
CREATE POLICY "video_logs_access" ON public.video_access_logs
  FOR ALL USING (user_id = auth.uid() OR is_sna_admin());

DROP POLICY IF EXISTS "video_violations_access" ON public.video_violations;
CREATE POLICY "video_violations_access" ON public.video_violations
  FOR ALL USING (user_id = auth.uid() OR is_sna_admin());

DROP POLICY IF EXISTS "video_risk_access" ON public.video_user_risk_scores;
CREATE POLICY "video_risk_access" ON public.video_user_risk_scores
  FOR SELECT USING (user_id = auth.uid() OR is_sna_admin());

DROP POLICY IF EXISTS "video_risk_admin" ON public.video_user_risk_scores;
CREATE POLICY "video_risk_admin" ON public.video_user_risk_scores
  FOR ALL USING (is_sna_admin());

DROP POLICY IF EXISTS "video_domain_read" ON public.video_domain_whitelist;
CREATE POLICY "video_domain_read" ON public.video_domain_whitelist
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "video_domain_admin" ON public.video_domain_whitelist;
CREATE POLICY "video_domain_admin" ON public.video_domain_whitelist
  FOR ALL USING (is_sna_admin());

-- 7.1 Gerar código de sessão único
CREATE OR REPLACE FUNCTION public.generate_session_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
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
SET search_path = public
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
    v_watermark_text := upper(COALESCE(v_user_name, 'ALUNO')) || ' • ' || v_user_cpf || ' • ' || v_session_code;
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
SET search_path = public
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
        total_watch_time_seconds = total_watch_time_seconds + 30
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

-- Comentários
COMMENT ON TABLE public.video_access_logs IS '🔥 VIDEO FORTRESS: Logs de acesso detalhados para auditoria completa';
COMMENT ON TABLE public.video_violations IS '🔥 VIDEO FORTRESS: Registro de violações de segurança';
COMMENT ON TABLE public.video_user_risk_scores IS '🔥 VIDEO FORTRESS: Score de risco acumulado por usuário';
COMMENT ON TABLE public.video_domain_whitelist IS '🔥 VIDEO FORTRESS: Domínios autorizados para embed';
COMMENT ON FUNCTION public.generate_session_code IS '🔥 VIDEO FORTRESS: Gera código único de sessão';
COMMENT ON FUNCTION public.create_video_session IS '🔥 VIDEO FORTRESS: Cria sessão de vídeo com watermark e revogação automática';
COMMENT ON FUNCTION public.video_session_heartbeat IS '🔥 VIDEO FORTRESS: Heartbeat para manter sessão ativa';