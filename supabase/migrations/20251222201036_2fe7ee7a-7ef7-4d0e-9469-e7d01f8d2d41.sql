
-- ============================================
-- 🛡️ FORTALEZA DIGITAL - TABELAS DE RATE LIMIT E WEBHOOKS
-- ============================================

-- Rate Limit State
CREATE TABLE IF NOT EXISTS public.rate_limit_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    blocked_until TIMESTAMPTZ,
    total_blocked_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(identifier, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup ON public.rate_limit_state(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked ON public.rate_limit_state(blocked_until) WHERE blocked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rate_limit_cleanup ON public.rate_limit_state(updated_at);

-- Webhook Events
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
CREATE INDEX IF NOT EXISTS idx_webhook_status ON public.webhook_events(status) WHERE status NOT IN ('processed', 'ignored');
CREATE INDEX IF NOT EXISTS idx_webhook_received ON public.webhook_events(received_at DESC);

-- Adicionar colunas faltantes em content_access_log se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_access_log' AND table_schema = 'public') THEN
        -- Verificar e adicionar colunas se não existirem
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_access_log' AND column_name = 'content_title') THEN
            ALTER TABLE public.content_access_log ADD COLUMN content_title TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_access_log' AND column_name = 'duration_seconds') THEN
            ALTER TABLE public.content_access_log ADD COLUMN duration_seconds INTEGER;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_access_log' AND column_name = 'progress_percent') THEN
            ALTER TABLE public.content_access_log ADD COLUMN progress_percent INTEGER;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_access_log' AND column_name = 'device_hash') THEN
            ALTER TABLE public.content_access_log ADD COLUMN device_hash TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_access_log' AND column_name = 'session_id') THEN
            ALTER TABLE public.content_access_log ADD COLUMN session_id UUID;
        END IF;
    END IF;
END $$;

-- Índices para content_access_log
CREATE INDEX IF NOT EXISTS idx_content_access_user ON public.content_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_content_access_content ON public.content_access_log(content_id);
CREATE INDEX IF NOT EXISTS idx_content_access_created ON public.content_access_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_access_type ON public.content_access_log(content_type);

-- Índices para active_sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.active_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_device ON public.active_sessions(device_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.active_sessions(expires_at) WHERE status = 'active';

-- ============================================
-- RLS POLICIES
-- ============================================

-- Rate Limit State
ALTER TABLE public.rate_limit_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rate_limit_system" ON public.rate_limit_state;
CREATE POLICY "rate_limit_system" ON public.rate_limit_state FOR ALL USING (true);

-- Webhook Events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhooks_admin_read" ON public.webhook_events;
CREATE POLICY "webhooks_admin_read" ON public.webhook_events
    FOR SELECT USING (public.is_owner(auth.uid()));

DROP POLICY IF EXISTS "webhooks_system_insert" ON public.webhook_events;
CREATE POLICY "webhooks_system_insert" ON public.webhook_events
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "webhooks_system_update" ON public.webhook_events;
CREATE POLICY "webhooks_system_update" ON public.webhook_events
    FOR UPDATE USING (true);

-- Content Access Log
DROP POLICY IF EXISTS "content_access_user_read" ON public.content_access_log;
CREATE POLICY "content_access_user_read" ON public.content_access_log
    FOR SELECT USING (auth.uid() = user_id OR public.is_owner(auth.uid()));

DROP POLICY IF EXISTS "content_access_user_insert" ON public.content_access_log;
CREATE POLICY "content_access_user_insert" ON public.content_access_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Active Sessions
DROP POLICY IF EXISTS "sessions_user_read" ON public.active_sessions;
CREATE POLICY "sessions_user_read" ON public.active_sessions
    FOR SELECT USING (auth.uid() = user_id OR public.is_owner(auth.uid()));

DROP POLICY IF EXISTS "sessions_user_manage" ON public.active_sessions;
CREATE POLICY "sessions_user_manage" ON public.active_sessions
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNÇÕES CORE (usando user_roles)
-- ============================================

-- get_user_role_v2 - Busca role da tabela user_roles
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
    LIMIT 1;
    
    RETURN COALESCE(v_role, 'viewer');
END;
$$;

-- is_admin - Usa user_roles
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN public.get_user_role_v2(p_user_id) IN ('owner', 'admin');
END;
$$;

-- is_beta - Usa user_roles
CREATE OR REPLACE FUNCTION public.is_beta(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN public.get_user_role_v2(p_user_id) IN ('owner', 'admin', 'beta');
END;
$$;

-- is_funcionario - Usa user_roles
CREATE OR REPLACE FUNCTION public.is_funcionario(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN public.get_user_role_v2(p_user_id) IN ('owner', 'admin', 'funcionario', 'employee', 'coordenacao', 'contabilidade');
END;
$$;

-- can_access_url_v2 - MAPA DEFINITIVO DE URLs
CREATE OR REPLACE FUNCTION public.can_access_url_v2(p_url TEXT, p_user_id UUID DEFAULT NULL)
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
    IF v_role = 'owner' THEN RETURN TRUE; END IF;
    
    -- Admin acessa quase tudo
    IF v_role = 'admin' THEN RETURN TRUE; END IF;
    
    -- Beta (aluno pagante) - acessa /alunos/*
    IF v_role = 'beta' THEN
        IF p_url LIKE '/alunos%' OR p_url LIKE '%/alunos%' THEN RETURN TRUE; END IF;
        IF p_url IN ('/', '/auth', '/termos', '/privacidade', '/area-gratuita', '/site') THEN RETURN TRUE; END IF;
        RETURN FALSE;
    END IF;
    
    -- Funcionário - acessa gestão, NÃO /alunos
    IF v_role IN ('funcionario', 'employee', 'coordenacao', 'contabilidade') THEN
        IF p_url LIKE '/alunos%' THEN RETURN FALSE; END IF;
        RETURN TRUE;
    END IF;
    
    -- Aluno gratuito / viewer - apenas rotas públicas
    IF p_url IN ('/', '/auth', '/termos', '/privacidade', '/area-gratuita', '/site') THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- log_security_event_v2 - Adaptado para estrutura existente
CREATE OR REPLACE FUNCTION public.log_security_event_v2(
    p_event_type TEXT,
    p_user_id UUID DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT 'info',
    p_source TEXT DEFAULT 'system',
    p_description TEXT DEFAULT NULL,
    p_payload JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.security_events (
        event_type, severity, source, description,
        ip_address, user_agent, payload
    ) VALUES (
        p_event_type, p_severity, p_source, p_description,
        p_ip_address, p_user_agent, p_payload
    ) RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;

-- Trigger para updated_at em rate_limit_state
DROP TRIGGER IF EXISTS update_rate_limit_state_updated_at ON public.rate_limit_state;
CREATE TRIGGER update_rate_limit_state_updated_at
    BEFORE UPDATE ON public.rate_limit_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.rate_limit_state IS 'Estado de rate limiting por identificador/endpoint';
COMMENT ON TABLE public.webhook_events IS 'Eventos de webhook para idempotência';
COMMENT ON FUNCTION public.can_access_url_v2 IS 'Verifica acesso por URL conforme MAPA DEFINITIVO';
