-- ============================================
-- 🛡️ SECURITY FORTRESS ULTRA - PARTE 3
-- Tabelas adicionais + Funções Core
-- Adaptado para usar user_roles
-- ============================================

-- ============================================
-- WEBHOOK EVENTS - Idempotência
-- ============================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    provider TEXT NOT NULL,
    event_id TEXT NOT NULL,
    event_type TEXT,
    
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed', 'ignored', 'duplicate')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    payload JSONB,
    response JSONB,
    last_error TEXT,
    
    ip_address INET,
    signature_valid BOOLEAN,
    signature_algorithm TEXT,
    
    UNIQUE(provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_provider ON public.webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_received ON public.webhook_events(received_at DESC);

-- ============================================
-- CONTENT ACCESS LOG - Logs de acesso
-- ============================================

CREATE TABLE IF NOT EXISTS public.content_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    user_id UUID NOT NULL,
    
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

-- ============================================
-- RLS PARA TABELAS
-- ============================================

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_access_log ENABLE ROW LEVEL SECURITY;

-- Webhook Events - apenas admin/owner
DROP POLICY IF EXISTS "webhooks_admin_read" ON public.webhook_events;
CREATE POLICY "webhooks_admin_read" ON public.webhook_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "webhooks_system_insert" ON public.webhook_events;
CREATE POLICY "webhooks_system_insert" ON public.webhook_events
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "webhooks_system_update" ON public.webhook_events;
CREATE POLICY "webhooks_system_update" ON public.webhook_events
    FOR UPDATE USING (true);

-- Content Access Log - usuário vê próprio, admin vê todos
DROP POLICY IF EXISTS "content_access_user_read" ON public.content_access_log;
CREATE POLICY "content_access_user_read" ON public.content_access_log
    FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "content_access_user_insert" ON public.content_access_log;
CREATE POLICY "content_access_user_insert" ON public.content_access_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNÇÕES CORE DE SEGURANÇA (usando user_roles)
-- ============================================

-- Função para obter role do usuário via user_roles
CREATE OR REPLACE FUNCTION public.get_user_role_v2(p_user_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_uid UUID := COALESCE(p_user_id, auth.uid());
BEGIN
    IF v_uid IS NULL THEN
        RETURN 'viewer';
    END IF;
    
    SELECT role::TEXT INTO v_role
    FROM public.user_roles
    WHERE user_id = v_uid
    ORDER BY 
        CASE role::TEXT
            WHEN 'owner' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'beta' THEN 3
            WHEN 'funcionario' THEN 4
            ELSE 5
        END
    LIMIT 1;
    
    RETURN COALESCE(v_role, 'viewer');
END;
$$;

-- Função: is_beta - Verifica se é aluno beta
CREATE OR REPLACE FUNCTION public.is_beta_user(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = COALESCE(p_user_id, auth.uid())
        AND role IN ('owner', 'admin', 'beta')
    );
END;
$$;

-- Função: is_funcionario - Verifica se é funcionário
CREATE OR REPLACE FUNCTION public.is_funcionario_user(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = COALESCE(p_user_id, auth.uid())
        AND role IN ('owner', 'admin', 'funcionario')
    );
END;
$$;

-- Função: can_access_url - Verifica acesso por URL (MAPA DEFINITIVO)
CREATE OR REPLACE FUNCTION public.can_access_url(p_url TEXT, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    v_role TEXT := public.get_user_role_v2(p_user_id);
BEGIN
    -- Owner acessa TUDO
    IF v_role = 'owner' THEN
        RETURN TRUE;
    END IF;
    
    -- Admin acessa quase tudo
    IF v_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Beta (aluno pagante) - acessa /alunos/*
    IF v_role = 'beta' THEN
        IF p_url LIKE '/alunos%' OR p_url LIKE '%/alunos%' THEN
            RETURN TRUE;
        END IF;
        IF p_url IN ('/', '/auth', '/termos', '/privacidade', '/area-gratuita', '/site') THEN
            RETURN TRUE;
        END IF;
        RETURN FALSE;
    END IF;
    
    -- Funcionário - acessa gestão
    IF v_role = 'funcionario' THEN
        IF p_url LIKE '/alunos%' THEN
            RETURN FALSE;
        END IF;
        RETURN TRUE;
    END IF;
    
    -- Aluno gratuito / viewer - apenas rotas públicas
    IF p_url IN ('/', '/auth', '/termos', '/privacidade', '/area-gratuita', '/site') THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Função: log_security_event_v2
CREATE OR REPLACE FUNCTION public.log_security_event_v2(
    p_event_type TEXT,
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_risk_score INTEGER DEFAULT 0,
    p_details JSONB DEFAULT NULL,
    p_fingerprint TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
    v_email TEXT;
BEGIN
    IF p_user_id IS NOT NULL THEN
        SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
    END IF;
    
    INSERT INTO public.security_events (
        user_id, user_email, event_type,
        ip_address, user_agent, risk_score,
        details, fingerprint, is_blocked
    ) VALUES (
        COALESCE(p_user_id, auth.uid()),
        v_email,
        p_event_type,
        p_ip_address,
        p_user_agent,
        p_risk_score,
        p_details,
        p_fingerprint,
        p_risk_score >= 80
    ) RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE public.webhook_events IS 'Idempotência de webhooks - evita processamento duplicado';
COMMENT ON TABLE public.content_access_log IS 'Log de acesso a conteúdo protegido';
COMMENT ON FUNCTION public.get_user_role_v2 IS 'Retorna role do usuário via user_roles';
COMMENT ON FUNCTION public.is_beta_user IS 'Verifica se usuário tem acesso beta';
COMMENT ON FUNCTION public.is_funcionario_user IS 'Verifica se usuário é funcionário';
COMMENT ON FUNCTION public.can_access_url IS 'Verifica acesso por URL baseado em role';
COMMENT ON FUNCTION public.log_security_event_v2 IS 'Registra evento de segurança';