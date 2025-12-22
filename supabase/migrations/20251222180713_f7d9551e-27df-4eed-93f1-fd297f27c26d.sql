-- ============================================
-- 🛡️ FORTALEZA DIGITAL - PARTE 4: Content & Sessions
-- ============================================

-- 1. TABELA: content_access_log
CREATE TABLE IF NOT EXISTS public.content_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf', 'material', 'live', 'lesson', 'course')),
    content_id UUID NOT NULL,
    content_title TEXT,
    action TEXT NOT NULL CHECK (action IN (
        'view_start', 'view_end', 'view_progress',
        'download_attempt', 'download_blocked',
        'share_attempt', 'share_blocked',
        'screenshot_detected', 'screen_record_detected',
        'completed'
    )),
    duration_seconds INTEGER,
    progress_percent INTEGER CHECK (progress_percent >= 0 AND progress_percent <= 100),
    ip_address INET,
    user_agent TEXT,
    device_hash TEXT,
    session_id UUID,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_content_access_user ON public.content_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_content_access_content ON public.content_access_log(content_id);
CREATE INDEX IF NOT EXISTS idx_content_access_created ON public.content_access_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_access_type ON public.content_access_log(content_type);
CREATE INDEX IF NOT EXISTS idx_content_access_suspicious ON public.content_access_log(action) 
    WHERE action IN ('download_attempt', 'share_attempt', 'screenshot_detected', 'screen_record_detected');

-- 2. Melhorar active_sessions existente
ALTER TABLE public.active_sessions 
    ADD COLUMN IF NOT EXISTS device_name TEXT,
    ADD COLUMN IF NOT EXISTS revoked_reason TEXT,
    ADD COLUMN IF NOT EXISTS mfa_verified BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_sessions_user_v2 ON public.active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active_v2 ON public.active_sessions(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sessions_device_v2 ON public.active_sessions(device_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_v2 ON public.active_sessions(expires_at) WHERE status = 'active';

-- 3. RLS para content_access_log
ALTER TABLE public.content_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_access_user_read" ON public.content_access_log;
CREATE POLICY "content_access_user_read" ON public.content_access_log
    FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

DROP POLICY IF EXISTS "content_access_user_insert" ON public.content_access_log;
CREATE POLICY "content_access_user_insert" ON public.content_access_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Melhorar RLS de active_sessions
DROP POLICY IF EXISTS "sessions_user_read" ON public.active_sessions;
CREATE POLICY "sessions_user_read" ON public.active_sessions
    FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner')
    );

DROP POLICY IF EXISTS "sessions_user_manage" ON public.active_sessions;
CREATE POLICY "sessions_user_manage" ON public.active_sessions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessions_user_insert" ON public.active_sessions;
CREATE POLICY "sessions_user_insert" ON public.active_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. FUNÇÕES DE SEGURANÇA (usando user_roles, não profiles.role)
CREATE OR REPLACE FUNCTION public.get_user_role_v2(p_user_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = 'public'
AS $$
DECLARE
    v_role TEXT;
    v_uid UUID := COALESCE(p_user_id, auth.uid());
BEGIN
    IF v_uid IS NULL THEN RETURN 'viewer'; END IF;
    SELECT role::TEXT INTO v_role FROM public.user_roles WHERE user_id = v_uid LIMIT 1;
    RETURN COALESCE(v_role, 'viewer');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_v2(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = 'public'
AS $$
BEGIN
    RETURN public.get_user_role_v2(p_user_id) IN ('owner', 'admin');
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_url_v3(p_url TEXT, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = 'public'
AS $$
DECLARE v_role TEXT := public.get_user_role_v2(p_user_id);
BEGIN
    IF v_role = 'owner' THEN RETURN TRUE; END IF;
    IF v_role = 'admin' THEN RETURN TRUE; END IF;
    IF v_role = 'beta' THEN
        IF p_url LIKE '/alunos%' OR p_url LIKE '%/alunos%' THEN RETURN TRUE; END IF;
        IF p_url IN ('/', '/auth', '/termos', '/privacidade', '/area-gratuita', '/site') THEN RETURN TRUE; END IF;
        RETURN FALSE;
    END IF;
    IF v_role IN ('funcionario', 'employee', 'coordenacao', 'contabilidade') THEN
        IF p_url LIKE '/alunos%' THEN RETURN FALSE; END IF;
        RETURN TRUE;
    END IF;
    IF p_url IN ('/', '/auth', '/termos', '/privacidade', '/area-gratuita', '/site') THEN RETURN TRUE; END IF;
    RETURN FALSE;
END;
$$;

-- 6. Função para log de acesso a conteúdo
CREATE OR REPLACE FUNCTION public.log_content_access(
    p_content_type TEXT,
    p_content_id UUID,
    p_action TEXT,
    p_content_title TEXT DEFAULT NULL,
    p_duration_seconds INTEGER DEFAULT NULL,
    p_progress_percent INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_log_id UUID;
BEGIN
    INSERT INTO public.content_access_log (
        user_id, content_type, content_id, action, content_title,
        duration_seconds, progress_percent, metadata
    ) VALUES (
        auth.uid(), p_content_type, p_content_id, p_action, p_content_title,
        p_duration_seconds, p_progress_percent, p_metadata
    ) RETURNING id INTO v_log_id;
    
    -- Log ações suspeitas no security_events
    IF p_action IN ('screenshot_detected', 'screen_record_detected', 'download_attempt', 'share_attempt') THEN
        INSERT INTO public.security_events (user_id, event_type, risk_score, payload)
        VALUES (auth.uid(), 'content_' || p_action, 
            CASE WHEN p_action LIKE '%detected' THEN 80 ELSE 40 END,
            jsonb_build_object('content_type', p_content_type, 'content_id', p_content_id, 'action', p_action));
    END IF;
    
    RETURN v_log_id;
END;
$$;

-- 7. Função para gerenciar sessões
CREATE OR REPLACE FUNCTION public.create_user_session(
    p_device_hash TEXT,
    p_device_type TEXT DEFAULT 'desktop',
    p_device_name TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_session_id UUID; v_invalidated INTEGER;
BEGIN
    -- Invalidar sessões anteriores (DOGMA I - Sessão Única)
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = now(), revoked_reason = 'new_session'
    WHERE user_id = auth.uid() AND status = 'active';
    GET DIAGNOSTICS v_invalidated = ROW_COUNT;
    
    -- Criar nova sessão
    INSERT INTO public.active_sessions (user_id, device_hash, device_type, device_name, status, is_current)
    VALUES (auth.uid(), p_device_hash, p_device_type, p_device_name, 'active', true)
    RETURNING id INTO v_session_id;
    
    -- Log
    INSERT INTO public.security_events (user_id, event_type, payload)
    VALUES (auth.uid(), 'login_success', jsonb_build_object(
        'session_id', v_session_id, 'sessions_invalidated', v_invalidated, 'device_type', p_device_type));
    
    RETURN v_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_user_session(p_session_id UUID, p_reason TEXT DEFAULT 'manual')
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = now(), revoked_reason = p_reason, is_current = false
    WHERE id = p_session_id AND user_id = auth.uid();
    RETURN FOUND;
END;
$$;

-- 8. Comentários
COMMENT ON TABLE public.content_access_log IS 'Log de acesso a conteúdo protegido - LEI III';
COMMENT ON FUNCTION public.log_content_access IS 'Registra acesso a conteúdo - LEI III';
COMMENT ON FUNCTION public.create_user_session IS 'Cria sessão única - DOGMA I';
COMMENT ON FUNCTION public.revoke_user_session IS 'Revoga sessão - DOGMA I';