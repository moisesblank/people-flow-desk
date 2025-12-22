-- ============================================
-- 🛡️ FORTALEZA DIGITAL ULTRA v2.0
-- MIGRAÇÃO DE SEGURANÇA ZERO-TRUST DEFINITIVA
-- 5.000+ USUÁRIOS SIMULTÂNEOS
-- MAPA DE URLs:
--   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ (role=NULL ou aluno_gratuito)
--   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (role=beta)
--   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/ (role=funcionario)
--   👑 OWNER: TODAS (role=owner)
-- ============================================

-- ============================================
-- PARTE 1: EXTENSÕES E CONFIGURAÇÕES
-- ============================================

-- Habilitar extensões de segurança
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PARTE 2: TIPOS ENUM PARA SEGURANÇA
-- ============================================

-- Tipo para roles do sistema
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM (
        'owner',           -- 👑 Acesso TOTAL
        'admin',           -- 👔 Administrador
        'beta',            -- 👨‍🎓 Aluno pagante
        'funcionario',     -- 👔 Funcionário
        'aluno_gratuito',  -- 🌐 Não pagante
        'viewer'           -- 👁️ Apenas visualização
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo para status de sessão
DO $$ BEGIN
    CREATE TYPE public.session_status AS ENUM (
        'active',
        'expired',
        'revoked',
        'suspicious'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo para severidade de eventos
DO $$ BEGIN
    CREATE TYPE public.security_severity AS ENUM (
        'debug',
        'info', 
        'warning',
        'error',
        'critical'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- PARTE 3: TABELAS DE SEGURANÇA CORE
-- ============================================

-- 3.1 AUDIT LOG - Log de auditoria IMUTÁVEL
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Contexto do usuário
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role TEXT,
    session_id UUID,
    
    -- Ação realizada
    action TEXT NOT NULL,
    action_category TEXT NOT NULL DEFAULT 'general',
    table_name TEXT,
    record_id TEXT,
    
    -- Dados da mudança
    old_data JSONB,
    new_data JSONB,
    
    -- Contexto de rede
    ip_address INET,
    user_agent TEXT,
    country_code TEXT,
    city TEXT,
    
    -- Metadados
    severity security_severity NOT NULL DEFAULT 'info',
    request_id UUID,
    correlation_id UUID,
    metadata JSONB,
    
    -- Índices temporais para particionamento
    log_date DATE GENERATED ALWAYS AS (created_at::DATE) STORED
);

-- Índices otimizados para audit log
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_category ON public.security_audit_log(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON public.security_audit_log(severity) WHERE severity IN ('warning', 'error', 'critical');
CREATE INDEX IF NOT EXISTS idx_audit_date ON public.security_audit_log(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON public.security_audit_log(ip_address);

-- 3.2 SECURITY EVENTS - Eventos de segurança e anomalias
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Usuário afetado
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    
    -- Tipo de evento
    event_type TEXT NOT NULL CHECK (event_type IN (
        -- Autenticação
        'login_success', 'login_failed', 'login_blocked', 'login_suspicious',
        'logout', 'session_expired', 'session_revoked', 'session_hijack_attempt',
        -- Dispositivos
        'device_new', 'device_blocked', 'device_limit_exceeded', 'device_suspicious',
        -- Rate limiting
        'rate_limit_warning', 'rate_limit_exceeded', 'rate_limit_blocked',
        -- Permissões
        'permission_denied', 'permission_escalation_attempt', 'role_changed',
        -- Conteúdo
        'content_access', 'content_download_attempt', 'content_share_attempt',
        -- Webhooks
        'webhook_invalid_signature', 'webhook_replay_attempt', 'webhook_processed',
        -- Admin
        'admin_action', 'config_changed', 'secret_accessed',
        -- Ameaças
        'brute_force_detected', 'xss_attempt', 'sql_injection_attempt', 'bot_detected'
    )),
    
    -- Contexto de rede
    ip_address INET,
    user_agent TEXT,
    country_code TEXT,
    city TEXT,
    asn TEXT,
    
    -- Avaliação de risco
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    is_blocked BOOLEAN DEFAULT false,
    
    -- Detalhes
    details JSONB,
    fingerprint TEXT,
    
    -- Resolução
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

-- Índices otimizados para security events
CREATE INDEX IF NOT EXISTS idx_sec_events_user ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sec_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sec_events_created ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_events_risk ON public.security_events(risk_score DESC) WHERE risk_score >= 50;
CREATE INDEX IF NOT EXISTS idx_sec_events_unresolved ON public.security_events(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_sec_events_ip ON public.security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_sec_events_fingerprint ON public.security_events(fingerprint);

-- 3.3 RATE LIMIT STATE - Estado do rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificador (user_id, IP, ou combinação)
    identifier TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    
    -- Estado
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    blocked_until TIMESTAMPTZ,
    total_blocked_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(identifier, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup ON public.rate_limit_state(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked ON public.rate_limit_state(blocked_until) WHERE blocked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rate_limit_cleanup ON public.rate_limit_state(updated_at);

-- 3.4 WEBHOOK EVENTS - Idempotência de webhooks
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    provider TEXT NOT NULL,
    event_id TEXT NOT NULL,
    event_type TEXT,
    
    -- Timestamps
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed', 'ignored', 'duplicate')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Dados
    payload JSONB,
    response JSONB,
    last_error TEXT,
    
    -- Segurança
    ip_address INET,
    signature_valid BOOLEAN,
    signature_algorithm TEXT,
    
    UNIQUE(provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_provider ON public.webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_status ON public.webhook_events(status) WHERE status NOT IN ('processed', 'ignored');
CREATE INDEX IF NOT EXISTS idx_webhook_received ON public.webhook_events(received_at DESC);

-- 3.5 CONTENT ACCESS LOG - Logs de acesso a conteúdo
CREATE TABLE IF NOT EXISTS public.content_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Usuário
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Conteúdo
    content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf', 'material', 'live', 'lesson', 'course')),
    content_id UUID NOT NULL,
    content_title TEXT,
    
    -- Ação
    action TEXT NOT NULL CHECK (action IN (
        'view_start', 'view_end', 'view_progress',
        'download_attempt', 'download_blocked',
        'share_attempt', 'share_blocked',
        'screenshot_detected', 'screen_record_detected',
        'completed'
    )),
    
    -- Progresso
    duration_seconds INTEGER,
    progress_percent INTEGER CHECK (progress_percent >= 0 AND progress_percent <= 100),
    
    -- Contexto
    ip_address INET,
    user_agent TEXT,
    device_hash TEXT,
    session_id UUID,
    
    -- Metadados
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_content_access_user ON public.content_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_content_access_content ON public.content_access_log(content_id);
CREATE INDEX IF NOT EXISTS idx_content_access_created ON public.content_access_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_access_type ON public.content_access_log(content_type);
CREATE INDEX IF NOT EXISTS idx_content_access_suspicious ON public.content_access_log(action) 
    WHERE action IN ('download_attempt', 'share_attempt', 'screenshot_detected', 'screen_record_detected');

-- 3.6 ACTIVE SESSIONS - Sessões ativas (complementa user_sessions)
CREATE TABLE IF NOT EXISTS public.active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identificação
    session_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    device_hash TEXT NOT NULL,
    device_name TEXT,
    device_type TEXT,
    
    -- Status
    status session_status NOT NULL DEFAULT 'active',
    
    -- Contexto
    ip_address INET,
    user_agent TEXT,
    country_code TEXT,
    city TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    
    -- Segurança
    is_current BOOLEAN DEFAULT false,
    mfa_verified BOOLEAN DEFAULT false,
    risk_score INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.active_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON public.active_sessions(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sessions_device ON public.active_sessions(device_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.active_sessions(expires_at) WHERE status = 'active';

-- ============================================
-- PARTE 4: RLS POLICIES
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- 4.1 AUDIT LOG - Somente owner lê, ninguém deleta
DROP POLICY IF EXISTS "audit_owner_read" ON public.security_audit_log;
CREATE POLICY "audit_owner_read" ON public.security_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

DROP POLICY IF EXISTS "audit_no_delete" ON public.security_audit_log;
CREATE POLICY "audit_no_delete" ON public.security_audit_log
    FOR DELETE USING (false);

DROP POLICY IF EXISTS "audit_system_insert" ON public.security_audit_log;
CREATE POLICY "audit_system_insert" ON public.security_audit_log
    FOR INSERT WITH CHECK (true);

-- 4.2 SECURITY EVENTS - Owner/Admin lê
DROP POLICY IF EXISTS "sec_events_admin_read" ON public.security_events;
CREATE POLICY "sec_events_admin_read" ON public.security_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- 4.3 WEBHOOK EVENTS - Owner/Admin lê
DROP POLICY IF EXISTS "webhooks_admin_read" ON public.webhook_events;
CREATE POLICY "webhooks_admin_read" ON public.webhook_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- 4.4 CONTENT ACCESS LOG - Usuário vê seus próprios, Admin vê todos
DROP POLICY IF EXISTS "content_access_user_read" ON public.content_access_log;
CREATE POLICY "content_access_user_read" ON public.content_access_log
    FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "content_access_user_insert" ON public.content_access_log;
CREATE POLICY "content_access_user_insert" ON public.content_access_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4.5 ACTIVE SESSIONS - Usuário gerencia suas sessões
DROP POLICY IF EXISTS "sessions_user_read" ON public.active_sessions;
CREATE POLICY "sessions_user_read" ON public.active_sessions
    FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

DROP POLICY IF EXISTS "sessions_user_manage" ON public.active_sessions;
CREATE POLICY "sessions_user_manage" ON public.active_sessions
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- PARTE 5: FUNÇÕES CORE DE SEGURANÇA
-- ============================================

-- 5.1 FUNÇÃO: get_user_role - Retorna role do usuário com cache
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_role TEXT;
    v_uid UUID := COALESCE(p_user_id, auth.uid());
BEGIN
    IF v_uid IS NULL THEN
        RETURN 'viewer';
    END IF;
    
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = v_uid;
    
    RETURN COALESCE(v_role, 'viewer');
END;
$$;

-- 5.2 FUNÇÃO: is_owner - Verifica se é owner
CREATE OR REPLACE FUNCTION public.is_owner(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN public.get_user_role(p_user_id) = 'owner';
END;
$$;

-- 5.3 FUNÇÃO: is_admin - Verifica se é admin ou owner
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN public.get_user_role(p_user_id) IN ('owner', 'admin');
END;
$$;

-- 5.4 FUNÇÃO: is_beta - Verifica se é aluno beta
CREATE OR REPLACE FUNCTION public.is_beta(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN public.get_user_role(p_user_id) IN ('owner', 'admin', 'beta');
END;
$$;

-- 5.5 FUNÇÃO: is_funcionario - Verifica se é funcionário
CREATE OR REPLACE FUNCTION public.is_funcionario(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN public.get_user_role(p_user_id) IN ('owner', 'admin', 'funcionario');
END;
$$;

-- 5.6 FUNÇÃO: can_access_url - Verifica acesso por URL (MAPA DEFINITIVO)
CREATE OR REPLACE FUNCTION public.can_access_url(p_url TEXT, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_role TEXT := public.get_user_role(p_user_id);
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
        -- Pode acessar rotas públicas
        IF p_url IN ('/', '/auth', '/termos', '/privacidade', '/area-gratuita', '/site') THEN
            RETURN TRUE;
        END IF;
        RETURN FALSE;
    END IF;
    
    -- Funcionário - acessa gestão
    IF v_role = 'funcionario' THEN
        -- NÃO pode acessar área de alunos (exclusiva beta)
        IF p_url LIKE '/alunos%' THEN
            RETURN FALSE;
        END IF;
        -- Pode acessar demais rotas
        RETURN TRUE;
    END IF;
    
    -- Aluno gratuito / viewer - apenas rotas públicas
    IF v_role IN ('aluno_gratuito', 'viewer') OR v_role IS NULL THEN
        IF p_url IN ('/', '/auth', '/termos', '/privacidade', '/area-gratuita', '/site') THEN
            RETURN TRUE;
        END IF;
        RETURN FALSE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- 5.7 FUNÇÃO: log_security_event - Registrar evento de segurança
CREATE OR REPLACE FUNCTION public.log_security_event(
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
AS $$
DECLARE
    v_id UUID;
    v_email TEXT;
BEGIN
    -- Buscar email do usuário
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

-- 5.8 FUNÇÃO: log_audit - Registrar evento de auditoria
CREATE OR REPLACE FUNCTION public.log_audit(
    p_action TEXT,
    p_category TEXT DEFAULT 'general',
    p_table_name TEXT DEFAULT NULL,
    p_record_id TEXT DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_severity security_severity DEFAULT 'info',
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
    v_user_id UUID := auth.uid();
    v_email TEXT;
    v_role TEXT;
BEGIN
    IF v_user_id IS NOT NULL THEN
        SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
        v_role := public.get_user_role(v_user_id);
    END IF;
    
    INSERT INTO public.security_audit_log (
        user_id, user_email, user_role,
        action, action_category, table_name, record_id,
        old_data, new_data, severity, metadata
    ) VALUES (
        v_user_id, v_email, v_role,
        p_action, p_category, p_table_name, p_record_id,
        p_old_data, p_new_data, p_severity, p_metadata
    ) RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;

-- 5.9 FUNÇÃO: check_rate_limit - Verificar rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_max_requests INTEGER DEFAULT 100,
    p_window_seconds INTEGER DEFAULT 60,
    p_block_seconds INTEGER DEFAULT 300
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_state RECORD;
    v_now TIMESTAMPTZ := now();
    v_window_start TIMESTAMPTZ;
BEGIN
    -- Buscar estado atual
    SELECT * INTO v_state
    FROM public.rate_limit_state
    WHERE identifier = p_identifier AND endpoint = p_endpoint;
    
    -- Se bloqueado, verificar se expirou
    IF v_state.blocked_until IS NOT NULL AND v_state.blocked_until > v_now THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'blocked', true,
            'blocked_until', v_state.blocked_until,
            'remaining', 0,
            'retry_after_seconds', EXTRACT(EPOCH FROM (v_state.blocked_until - v_now))::INTEGER
        );
    END IF;
    
    v_window_start := v_now - (p_window_seconds || ' seconds')::INTERVAL;
    
    -- Se não existe ou janela expirou, criar/resetar
    IF v_state IS NULL OR v_state.window_start < v_window_start THEN
        INSERT INTO public.rate_limit_state (identifier, endpoint, request_count, window_start)
        VALUES (p_identifier, p_endpoint, 1, v_now)
        ON CONFLICT (identifier, endpoint)
        DO UPDATE SET 
            request_count = 1,
            window_start = v_now,
            blocked_until = NULL,
            updated_at = v_now;
        
        RETURN jsonb_build_object(
            'allowed', true,
            'blocked', false,
            'remaining', p_max_requests - 1,
            'reset_at', v_now + (p_window_seconds || ' seconds')::INTERVAL
        );
    END IF;
    
    -- Verificar se atingiu limite
    IF v_state.request_count >= p_max_requests THEN
        -- Bloquear
        UPDATE public.rate_limit_state
        SET blocked_until = v_now + (p_block_seconds || ' seconds')::INTERVAL,
            total_blocked_count = total_blocked_count + 1,
            updated_at = v_now
        WHERE identifier = p_identifier AND endpoint = p_endpoint;
        
        -- Registrar evento de segurança
        PERFORM public.log_security_event(
            'rate_limit_exceeded',
            NULL,
            p_identifier::INET,
            NULL,
            70,
            jsonb_build_object('endpoint', p_endpoint, 'count', v_state.request_count)
        );
        
        RETURN jsonb_build_object(
            'allowed', false,
            'blocked', true,
            'blocked_until', v_now + (p_block_seconds || ' seconds')::INTERVAL,
            'remaining', 0,
            'retry_after_seconds', p_block_seconds
        );
    END IF;
    
    -- Incrementar contador
    UPDATE public.rate_limit_state
    SET request_count = request_count + 1,
        updated_at = v_now
    WHERE identifier = p_identifier AND endpoint = p_endpoint;
    
    RETURN jsonb_build_object(
        'allowed', true,
        'blocked', false,
        'remaining', p_max_requests - v_state.request_count - 1,
        'reset_at', v_state.window_start + (p_window_seconds || ' seconds')::INTERVAL
    );
END;
$$;

-- 5.10 FUNÇÃO: check_webhook_idempotency - Verificar duplicação de webhook
CREATE OR REPLACE FUNCTION public.check_webhook_idempotency(
    p_provider TEXT,
    p_event_id TEXT,
    p_event_type TEXT DEFAULT NULL,
    p_payload JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_signature_valid BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing RECORD;
BEGIN
    -- Verificar se já existe
    SELECT * INTO v_existing
    FROM public.webhook_events
    WHERE provider = p_provider AND event_id = p_event_id;
    
    IF v_existing IS NOT NULL THEN
        -- Marcar como duplicata
        UPDATE public.webhook_events
        SET status = 'duplicate',
            attempts = attempts + 1
        WHERE id = v_existing.id;
        
        -- Log de tentativa de replay
        PERFORM public.log_security_event(
            'webhook_replay_attempt',
            NULL,
            p_ip_address,
            NULL,
            50,
            jsonb_build_object(
                'provider', p_provider,
                'event_id', p_event_id,
                'original_status', v_existing.status
            )
        );
        
        RETURN jsonb_build_object(
            'is_duplicate', true,
            'original_id', v_existing.id,
            'original_status', v_existing.status,
            'processed_at', v_existing.processed_at
        );
    END IF;
    
    -- Registrar novo evento
    INSERT INTO public.webhook_events (
        provider, event_id, event_type, payload, ip_address, signature_valid
    ) VALUES (
        p_provider, p_event_id, p_event_type, p_payload, p_ip_address, p_signature_valid
    );
    
    RETURN jsonb_build_object(
        'is_duplicate', false,
        'event_id', p_event_id,
        'status', 'received'
    );
END;
$$;

-- 5.11 FUNÇÃO: mark_webhook_processed - Marcar webhook como processado
CREATE OR REPLACE FUNCTION public.mark_webhook_processed(
    p_provider TEXT,
    p_event_id TEXT,
    p_status TEXT DEFAULT 'processed',
    p_response JSONB DEFAULT NULL,
    p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.webhook_events
    SET 
        status = p_status,
        processed_at = CASE WHEN p_status = 'processed' THEN now() ELSE processed_at END,
        response = p_response,
        last_error = p_error,
        attempts = attempts + 1
    WHERE provider = p_provider AND event_id = p_event_id;
    
    RETURN FOUND;
END;
$$;

-- 5.12 FUNÇÃO: validate_session - Validar sessão ativa
CREATE OR REPLACE FUNCTION public.validate_session(p_session_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_now TIMESTAMPTZ := now();
BEGIN
    SELECT * INTO v_session
    FROM public.active_sessions
    WHERE session_token = p_session_token;
    
    IF v_session IS NULL THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'session_not_found');
    END IF;
    
    IF v_session.status != 'active' THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'session_' || v_session.status);
    END IF;
    
    IF v_session.expires_at < v_now THEN
        -- Marcar como expirada
        UPDATE public.active_sessions
        SET status = 'expired'
        WHERE id = v_session.id;
        
        RETURN jsonb_build_object('valid', false, 'reason', 'session_expired');
    END IF;
    
    -- Atualizar última atividade
    UPDATE public.active_sessions
    SET last_activity_at = v_now
    WHERE id = v_session.id;
    
    RETURN jsonb_build_object(
        'valid', true,
        'user_id', v_session.user_id,
        'device_hash', v_session.device_hash,
        'mfa_verified', v_session.mfa_verified,
        'expires_at', v_session.expires_at
    );
END;
$$;

-- 5.13 FUNÇÃO: revoke_other_sessions - Revogar outras sessões (single session)
CREATE OR REPLACE FUNCTION public.revoke_other_sessions(
    p_user_id UUID,
    p_current_session_token UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.active_sessions
    SET 
        status = 'revoked',
        revoked_at = now(),
        revoked_reason = 'new_session_login'
    WHERE user_id = p_user_id
    AND session_token != p_current_session_token
    AND status = 'active';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    IF v_count > 0 THEN
        -- Log evento de segurança
        PERFORM public.log_security_event(
            'session_revoked',
            p_user_id,
            NULL,
            NULL,
            30,
            jsonb_build_object('revoked_count', v_count, 'reason', 'new_login')
        );
    END IF;
    
    RETURN v_count;
END;
$$;

-- 5.14 FUNÇÃO: audit_rls_coverage - Auditar cobertura RLS
CREATE OR REPLACE FUNCTION public.audit_rls_coverage()
RETURNS TABLE (
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count BIGINT,
    has_select_policy BOOLEAN,
    has_insert_policy BOOLEAN,
    has_update_policy BOOLEAN,
    has_delete_policy BOOLEAN,
    risk_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity,
        COALESCE(p.policy_count, 0)::BIGINT,
        COALESCE(p.has_select, false),
        COALESCE(p.has_insert, false),
        COALESCE(p.has_update, false),
        COALESCE(p.has_delete, false),
        CASE 
            WHEN NOT t.rowsecurity THEN 'CRITICAL'
            WHEN COALESCE(p.policy_count, 0) = 0 THEN 'HIGH'
            WHEN NOT COALESCE(p.has_select, false) THEN 'MEDIUM'
            ELSE 'LOW'
        END::TEXT
    FROM pg_tables t
    LEFT JOIN (
        SELECT 
            pol.tablename,
            COUNT(*) as policy_count,
            BOOL_OR(pol.cmd = 'SELECT' OR pol.cmd = '*') as has_select,
            BOOL_OR(pol.cmd = 'INSERT' OR pol.cmd = '*') as has_insert,
            BOOL_OR(pol.cmd = 'UPDATE' OR pol.cmd = '*') as has_update,
            BOOL_OR(pol.cmd = 'DELETE' OR pol.cmd = '*') as has_delete
        FROM pg_policies pol
        WHERE pol.schemaname = 'public'
        GROUP BY pol.tablename
    ) p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE '_prisma_%'
    ORDER BY 
        CASE 
            WHEN NOT t.rowsecurity THEN 1
            WHEN COALESCE(p.policy_count, 0) = 0 THEN 2
            ELSE 3
        END,
        t.tablename;
END;
$$;

-- ============================================
-- PARTE 6: FUNÇÕES DE CLEANUP
-- ============================================

-- 6.1 Limpar rate limits expirados
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM public.rate_limit_state
    WHERE updated_at < now() - INTERVAL '1 day';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- 6.2 Limpar sessões expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.active_sessions
    SET status = 'expired'
    WHERE status = 'active'
    AND expires_at < now();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Deletar sessões muito antigas
    DELETE FROM public.active_sessions
    WHERE created_at < now() - INTERVAL '30 days';
    
    RETURN v_count;
END;
$$;

-- 6.3 Limpar eventos de segurança resolvidos antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_security_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM public.security_events
    WHERE resolved = true
    AND resolved_at < now() - INTERVAL '90 days';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- ============================================
-- PARTE 7: TRIGGERS DE AUDITORIA
-- ============================================

-- 7.1 Trigger para auditar mudanças em profiles
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Detectar mudança de role (crítico)
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            PERFORM public.log_audit(
                'role_changed',
                'security',
                'profiles',
                NEW.id::TEXT,
                jsonb_build_object('role', OLD.role),
                jsonb_build_object('role', NEW.role),
                'critical'::security_severity,
                jsonb_build_object('changed_by', auth.uid())
            );
            
            PERFORM public.log_security_event(
                'role_changed',
                NEW.id,
                NULL,
                NULL,
                90,
                jsonb_build_object(
                    'old_role', OLD.role,
                    'new_role', NEW.role,
                    'changed_by', auth.uid()
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_profile_changes ON public.profiles;
CREATE TRIGGER trigger_audit_profile_changes
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_profile_changes();

-- ============================================
-- PARTE 8: COMENTÁRIOS DE DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE public.security_audit_log IS '🛡️ Log de auditoria imutável - TODAS as ações críticas';
COMMENT ON TABLE public.security_events IS '🛡️ Eventos de segurança e anomalias detectadas';
COMMENT ON TABLE public.rate_limit_state IS '🛡️ Estado do rate limiting por endpoint';
COMMENT ON TABLE public.webhook_events IS '🛡️ Registro de webhooks para idempotência';
COMMENT ON TABLE public.content_access_log IS '🛡️ Logs de acesso a conteúdo protegido';
COMMENT ON TABLE public.active_sessions IS '🛡️ Sessões ativas do sistema';

COMMENT ON FUNCTION public.get_user_role IS '🛡️ Retorna o role do usuário atual';
COMMENT ON FUNCTION public.is_owner IS '🛡️ Verifica se usuário é owner';
COMMENT ON FUNCTION public.is_admin IS '🛡️ Verifica se usuário é admin ou owner';
COMMENT ON FUNCTION public.is_beta IS '🛡️ Verifica se usuário é aluno beta';
COMMENT ON FUNCTION public.can_access_url IS '🛡️ Verifica permissão de acesso por URL';
COMMENT ON FUNCTION public.check_rate_limit IS '🛡️ Verificar e aplicar rate limiting';
COMMENT ON FUNCTION public.log_security_event IS '🛡️ Registrar evento de segurança';
COMMENT ON FUNCTION public.log_audit IS '🛡️ Registrar evento de auditoria';
COMMENT ON FUNCTION public.audit_rls_coverage IS '🛡️ Auditar cobertura RLS em todas as tabelas';
