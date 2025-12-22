-- ============================================
-- 🛡️ MIGRAÇÃO: FORTALEZA DIGITAL v1.0
-- Segurança Zero-Trust para 5.000+ usuários
-- Baseado na Matriz M4 - Controles de Segurança
-- ============================================

-- ============================================
-- 1. TABELA: audit_log (C014)
-- Log de auditoria IMUTÁVEL
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    metadata JSONB,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical'))
);

-- Índices para audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON public.audit_log(severity) WHERE severity IN ('warning', 'error', 'critical');

-- RLS para audit_log (somente admin lê, ninguém deleta)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_admin_read" ON public.audit_log;
CREATE POLICY "audit_log_admin_read" ON public.audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- Trigger não permite DELETE
DROP POLICY IF EXISTS "audit_log_no_delete" ON public.audit_log;
CREATE POLICY "audit_log_no_delete" ON public.audit_log
    FOR DELETE USING (false);

-- INSERT permitido para sistema
DROP POLICY IF EXISTS "audit_log_system_insert" ON public.audit_log;
CREATE POLICY "audit_log_system_insert" ON public.audit_log
    FOR INSERT WITH CHECK (true);

-- ============================================
-- 2. TABELA: webhook_events (C040/C041)
-- Idempotência de webhooks
-- ============================================
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    event_id TEXT NOT NULL,
    event_type TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed', 'ignored')),
    payload JSONB,
    response JSONB,
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    ip_address INET,
    signature_valid BOOLEAN,
    UNIQUE(provider, event_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON public.webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(status) WHERE status != 'processed';
CREATE INDEX IF NOT EXISTS idx_webhook_events_received ON public.webhook_events(received_at DESC);

-- RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhook_events_admin_read" ON public.webhook_events;
CREATE POLICY "webhook_events_admin_read" ON public.webhook_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ============================================
-- 3. TABELA: security_events (Anomalias)
-- Detecção de atividades suspeitas (C023)
-- ============================================
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'login_failed', 'login_success', 'login_suspicious',
        'brute_force_attempt', 'rate_limit_exceeded',
        'session_hijack_attempt', 'device_new', 'device_suspicious',
        'permission_denied', 'data_access_anomaly',
        'password_reset', 'mfa_enabled', 'mfa_disabled',
        'admin_action', 'api_abuse'
    )),
    ip_address INET,
    user_agent TEXT,
    country_code TEXT,
    city TEXT,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    details JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_unresolved ON public.security_events(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON public.security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_risk ON public.security_events(risk_score DESC) WHERE risk_score > 50;

-- RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_events_admin_read" ON public.security_events;
CREATE POLICY "security_events_admin_read" ON public.security_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ============================================
-- 4. TABELA: content_access_logs (C064)
-- Logs de acesso a conteúdo (vídeo/PDF)
-- ============================================
CREATE TABLE IF NOT EXISTS public.content_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf', 'material', 'live')),
    content_id UUID NOT NULL,
    content_title TEXT,
    action TEXT NOT NULL CHECK (action IN ('view', 'download_attempt', 'share_attempt', 'screenshot_attempt', 'complete')),
    duration_seconds INTEGER,
    progress_percent INTEGER,
    ip_address INET,
    user_agent TEXT,
    device_hash TEXT,
    session_id UUID,
    metadata JSONB
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_content_access_user ON public.content_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_content_access_content ON public.content_access_logs(content_id);
CREATE INDEX IF NOT EXISTS idx_content_access_created ON public.content_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_access_type ON public.content_access_logs(content_type);
CREATE INDEX IF NOT EXISTS idx_content_access_suspicious ON public.content_access_logs(action) 
    WHERE action IN ('download_attempt', 'share_attempt', 'screenshot_attempt');

-- RLS
ALTER TABLE public.content_access_logs ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas seus próprios logs
DROP POLICY IF EXISTS "content_access_user_read" ON public.content_access_logs;
CREATE POLICY "content_access_user_read" ON public.content_access_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Admin vê todos
DROP POLICY IF EXISTS "content_access_admin_read" ON public.content_access_logs;
CREATE POLICY "content_access_admin_read" ON public.content_access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Insert permitido para usuário logado
DROP POLICY IF EXISTS "content_access_insert" ON public.content_access_logs;
CREATE POLICY "content_access_insert" ON public.content_access_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. TABELA: rate_limit_state (C030)
-- Estado do rate limiting por usuário/IP
-- ============================================
CREATE TABLE IF NOT EXISTS public.rate_limit_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- user_id, IP, ou combinação
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(identifier, endpoint)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON public.rate_limit_state(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked ON public.rate_limit_state(blocked_until) WHERE blocked_until IS NOT NULL;

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_max_requests INTEGER DEFAULT 100,
    p_window_seconds INTEGER DEFAULT 60,
    p_block_seconds INTEGER DEFAULT 300
) RETURNS JSONB AS $$
DECLARE
    v_state RECORD;
    v_now TIMESTAMPTZ := now();
    v_window_start TIMESTAMPTZ;
    v_result JSONB;
BEGIN
    -- Buscar estado atual
    SELECT * INTO v_state
    FROM public.rate_limit_state
    WHERE identifier = p_identifier AND endpoint = p_endpoint;
    
    -- Se bloqueado, verificar se já passou
    IF v_state.blocked_until IS NOT NULL AND v_state.blocked_until > v_now THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'blocked', true,
            'blocked_until', v_state.blocked_until,
            'remaining', 0
        );
    END IF;
    
    -- Calcular início da janela
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
            'remaining', p_max_requests - 1
        );
    END IF;
    
    -- Incrementar contador
    IF v_state.request_count >= p_max_requests THEN
        -- Bloquear
        UPDATE public.rate_limit_state
        SET blocked_until = v_now + (p_block_seconds || ' seconds')::INTERVAL,
            updated_at = v_now
        WHERE identifier = p_identifier AND endpoint = p_endpoint;
        
        -- Registrar evento de segurança
        INSERT INTO public.security_events (event_type, ip_address, details)
        VALUES ('rate_limit_exceeded', p_identifier::INET, jsonb_build_object(
            'endpoint', p_endpoint,
            'count', v_state.request_count
        ));
        
        RETURN jsonb_build_object(
            'allowed', false,
            'blocked', true,
            'blocked_until', v_now + (p_block_seconds || ' seconds')::INTERVAL,
            'remaining', 0
        );
    END IF;
    
    -- Incrementar
    UPDATE public.rate_limit_state
    SET request_count = request_count + 1,
        updated_at = v_now
    WHERE identifier = p_identifier AND endpoint = p_endpoint;
    
    RETURN jsonb_build_object(
        'allowed', true,
        'blocked', false,
        'remaining', p_max_requests - v_state.request_count - 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. FUNÇÃO: log_audit_event (C014)
-- Helper para registrar eventos de auditoria
-- ============================================
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_table_name TEXT DEFAULT NULL,
    p_record_id TEXT DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_severity TEXT DEFAULT 'info'
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.audit_log (
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        metadata,
        severity
    ) VALUES (
        auth.uid(),
        p_action,
        p_table_name,
        p_record_id,
        p_old_data,
        p_new_data,
        p_metadata,
        p_severity
    ) RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. FUNÇÃO: log_security_event (C023)
-- Helper para registrar eventos de segurança
-- ============================================
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type TEXT,
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_risk_score INTEGER DEFAULT 0,
    p_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.security_events (
        user_id,
        event_type,
        ip_address,
        user_agent,
        risk_score,
        details
    ) VALUES (
        COALESCE(p_user_id, auth.uid()),
        p_event_type,
        p_ip_address,
        p_user_agent,
        p_risk_score,
        p_details
    ) RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. FUNÇÃO: check_webhook_idempotency (C040)
-- Verificar e registrar webhook
-- ============================================
CREATE OR REPLACE FUNCTION public.check_webhook_idempotency(
    p_provider TEXT,
    p_event_id TEXT,
    p_event_type TEXT DEFAULT NULL,
    p_payload JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_signature_valid BOOLEAN DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_existing RECORD;
BEGIN
    -- Verificar se já existe
    SELECT * INTO v_existing
    FROM public.webhook_events
    WHERE provider = p_provider AND event_id = p_event_id;
    
    IF v_existing IS NOT NULL THEN
        -- Já processado - retornar idempotente
        RETURN jsonb_build_object(
            'is_duplicate', true,
            'original_id', v_existing.id,
            'original_status', v_existing.status,
            'processed_at', v_existing.processed_at
        );
    END IF;
    
    -- Registrar novo evento
    INSERT INTO public.webhook_events (
        provider,
        event_id,
        event_type,
        payload,
        ip_address,
        signature_valid
    ) VALUES (
        p_provider,
        p_event_id,
        p_event_type,
        p_payload,
        p_ip_address,
        p_signature_valid
    );
    
    RETURN jsonb_build_object(
        'is_duplicate', false,
        'event_id', p_event_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. FUNÇÃO: mark_webhook_processed
-- Marcar webhook como processado
-- ============================================
CREATE OR REPLACE FUNCTION public.mark_webhook_processed(
    p_provider TEXT,
    p_event_id TEXT,
    p_status TEXT DEFAULT 'processed',
    p_response JSONB DEFAULT NULL,
    p_error TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. FUNÇÃO: is_admin (C012)
-- Verificar se usuário é admin/owner
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = COALESCE(p_user_id, auth.uid())
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 11. FUNÇÃO: is_owner (C012)
-- Verificar se usuário é owner
-- ============================================
CREATE OR REPLACE FUNCTION public.is_owner(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = COALESCE(p_user_id, auth.uid())
        AND role = 'owner'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 12. FUNÇÃO: has_role (C012)
-- Verificar role específico
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(p_role TEXT, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = COALESCE(p_user_id, auth.uid())
        AND role = p_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 13. TRIGGER: audit_profiles_changes
-- Auditar mudanças em profiles
-- ============================================
CREATE OR REPLACE FUNCTION public.audit_profiles_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Detectar mudança de role (crítico)
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            PERFORM public.log_audit_event(
                'role_changed',
                'profiles',
                NEW.id::TEXT,
                jsonb_build_object('role', OLD.role),
                jsonb_build_object('role', NEW.role),
                NULL,
                'critical'
            );
            
            PERFORM public.log_security_event(
                'admin_action',
                NEW.id,
                NULL,
                NULL,
                80,
                jsonb_build_object(
                    'action', 'role_changed',
                    'old_role', OLD.role,
                    'new_role', NEW.role
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_profiles_changes ON public.profiles;
CREATE TRIGGER audit_profiles_changes
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_profiles_trigger();

-- ============================================
-- 14. LIMPEZA AUTOMÁTICA (C016)
-- Jobs de retenção de dados
-- ============================================

-- Limpar rate limit states antigos
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.rate_limit_state
        WHERE updated_at < now() - INTERVAL '1 day'
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Limpar security events resolvidos antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_security_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.security_events
        WHERE resolved = true
        AND resolved_at < now() - INTERVAL '90 days'
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 15. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.audit_log IS 'Log de auditoria imutável - todas as ações críticas';
COMMENT ON TABLE public.webhook_events IS 'Registro de webhooks para idempotência';
COMMENT ON TABLE public.security_events IS 'Eventos de segurança e anomalias';
COMMENT ON TABLE public.content_access_logs IS 'Logs de acesso a conteúdo protegido';
COMMENT ON TABLE public.rate_limit_state IS 'Estado do rate limiting por endpoint';

COMMENT ON FUNCTION public.check_rate_limit IS 'Verificar e aplicar rate limiting';
COMMENT ON FUNCTION public.log_audit_event IS 'Registrar evento de auditoria';
COMMENT ON FUNCTION public.log_security_event IS 'Registrar evento de segurança';
COMMENT ON FUNCTION public.check_webhook_idempotency IS 'Verificar duplicação de webhook';
COMMENT ON FUNCTION public.is_admin IS 'Verificar se usuário é admin ou owner';
COMMENT ON FUNCTION public.is_owner IS 'Verificar se usuário é owner';
