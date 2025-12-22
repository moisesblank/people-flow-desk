
-- ============================================
-- 🛡️ FORTALEZA DIGITAL ULTRA v2.0 (CORRIGIDA)
-- MIGRAÇÃO DE SEGURANÇA ZERO-TRUST DEFINITIVA
-- ============================================

-- PARTE 1: EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PARTE 2: ENUMS
DO $$ BEGIN
    CREATE TYPE public.session_status AS ENUM ('active', 'expired', 'revoked', 'suspicious');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.security_severity AS ENUM ('debug', 'info', 'warning', 'error', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PARTE 3: TABELAS

-- 3.1 SECURITY AUDIT LOG (sem coluna gerada)
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role TEXT,
    session_id UUID,
    action TEXT NOT NULL,
    action_category TEXT NOT NULL DEFAULT 'general',
    table_name TEXT,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    country_code TEXT,
    city TEXT,
    severity public.security_severity NOT NULL DEFAULT 'info',
    request_id UUID,
    correlation_id UUID,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_sec_audit_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sec_audit_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_audit_action ON public.security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_sec_audit_category ON public.security_audit_log(action_category);
CREATE INDEX IF NOT EXISTS idx_sec_audit_severity ON public.security_audit_log(severity) WHERE severity IN ('warning', 'error', 'critical');

-- 3.2 SECURITY EVENTS
CREATE TABLE IF NOT EXISTS public.security_events_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    event_type TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    country_code TEXT,
    city TEXT,
    asn TEXT,
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    is_blocked BOOLEAN DEFAULT false,
    details JSONB,
    fingerprint TEXT,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_sec_events_v2_user ON public.security_events_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_sec_events_v2_type ON public.security_events_v2(event_type);
CREATE INDEX IF NOT EXISTS idx_sec_events_v2_created ON public.security_events_v2(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_events_v2_risk ON public.security_events_v2(risk_score DESC) WHERE risk_score >= 50;
CREATE INDEX IF NOT EXISTS idx_sec_events_v2_unresolved ON public.security_events_v2(resolved) WHERE resolved = false;

-- 3.3 RATE LIMIT STATE
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

-- 3.4 WEBHOOK EVENTS
CREATE TABLE IF NOT EXISTS public.webhook_events_v2 (
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

CREATE INDEX IF NOT EXISTS idx_webhook_v2_provider ON public.webhook_events_v2(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_v2_status ON public.webhook_events_v2(status) WHERE status NOT IN ('processed', 'ignored');
CREATE INDEX IF NOT EXISTS idx_webhook_v2_received ON public.webhook_events_v2(received_at DESC);

-- 3.5 CONTENT ACCESS LOG
CREATE TABLE IF NOT EXISTS public.content_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    content_id UUID NOT NULL,
    content_title TEXT,
    action TEXT NOT NULL,
    duration_seconds INTEGER,
    progress_percent INTEGER,
    ip_address INET,
    user_agent TEXT,
    device_hash TEXT,
    session_id UUID,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_content_access_user ON public.content_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_content_access_content ON public.content_access_log(content_id);
CREATE INDEX IF NOT EXISTS idx_content_access_created ON public.content_access_log(created_at DESC);

-- 3.6 ACTIVE SESSIONS
CREATE TABLE IF NOT EXISTS public.active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    device_hash TEXT NOT NULL,
    device_name TEXT,
    device_type TEXT,
    status public.session_status NOT NULL DEFAULT 'active',
    ip_address INET,
    user_agent TEXT,
    country_code TEXT,
    city TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    is_current BOOLEAN DEFAULT false,
    mfa_verified BOOLEAN DEFAULT false,
    risk_score INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON public.active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_token ON public.active_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_active_sessions_active ON public.active_sessions(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires ON public.active_sessions(expires_at) WHERE status = 'active';

-- PARTE 4: RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Audit Log
DROP POLICY IF EXISTS "sec_audit_owner_read" ON public.security_audit_log;
CREATE POLICY "sec_audit_owner_read" ON public.security_audit_log FOR SELECT USING (public.is_owner(auth.uid()));
DROP POLICY IF EXISTS "sec_audit_no_delete" ON public.security_audit_log;
CREATE POLICY "sec_audit_no_delete" ON public.security_audit_log FOR DELETE USING (false);
DROP POLICY IF EXISTS "sec_audit_system_insert" ON public.security_audit_log;
CREATE POLICY "sec_audit_system_insert" ON public.security_audit_log FOR INSERT WITH CHECK (true);

-- Security Events
DROP POLICY IF EXISTS "sec_events_v2_admin_read" ON public.security_events_v2;
CREATE POLICY "sec_events_v2_admin_read" ON public.security_events_v2 FOR SELECT USING (public.is_admin_or_owner(auth.uid()));
DROP POLICY IF EXISTS "sec_events_v2_system_insert" ON public.security_events_v2;
CREATE POLICY "sec_events_v2_system_insert" ON public.security_events_v2 FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "sec_events_v2_admin_update" ON public.security_events_v2;
CREATE POLICY "sec_events_v2_admin_update" ON public.security_events_v2 FOR UPDATE USING (public.is_admin_or_owner(auth.uid()));

-- Rate Limit
DROP POLICY IF EXISTS "rate_limit_system_all" ON public.rate_limit_state;
CREATE POLICY "rate_limit_system_all" ON public.rate_limit_state FOR ALL USING (true);

-- Webhooks
DROP POLICY IF EXISTS "webhook_v2_admin_read" ON public.webhook_events_v2;
CREATE POLICY "webhook_v2_admin_read" ON public.webhook_events_v2 FOR SELECT USING (public.is_admin_or_owner(auth.uid()));
DROP POLICY IF EXISTS "webhook_v2_system_all" ON public.webhook_events_v2;
CREATE POLICY "webhook_v2_system_all" ON public.webhook_events_v2 FOR ALL USING (true);

-- Content Access
DROP POLICY IF EXISTS "content_access_user_read" ON public.content_access_log;
CREATE POLICY "content_access_user_read" ON public.content_access_log FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));
DROP POLICY IF EXISTS "content_access_user_insert" ON public.content_access_log;
CREATE POLICY "content_access_user_insert" ON public.content_access_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Active Sessions
DROP POLICY IF EXISTS "active_sessions_user_read" ON public.active_sessions;
CREATE POLICY "active_sessions_user_read" ON public.active_sessions FOR SELECT USING (auth.uid() = user_id OR public.is_owner(auth.uid()));
DROP POLICY IF EXISTS "active_sessions_user_manage" ON public.active_sessions;
CREATE POLICY "active_sessions_user_manage" ON public.active_sessions FOR ALL USING (auth.uid() = user_id);

-- PARTE 5: FUNÇÕES

-- get_user_role_v2
CREATE OR REPLACE FUNCTION public.get_user_role_v2(p_user_id UUID DEFAULT NULL)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE v_role TEXT; v_uid UUID := COALESCE(p_user_id, auth.uid());
BEGIN
    IF v_uid IS NULL THEN RETURN 'viewer'; END IF;
    SELECT role::TEXT INTO v_role FROM public.user_roles WHERE user_id = v_uid LIMIT 1;
    RETURN COALESCE(v_role, 'viewer');
END;
$$;

-- is_beta_v2
CREATE OR REPLACE FUNCTION public.is_beta_v2(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN RETURN public.get_user_role_v2(p_user_id) IN ('owner', 'admin', 'beta'); END;
$$;

-- is_funcionario_v2
CREATE OR REPLACE FUNCTION public.is_funcionario_v2(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN RETURN public.get_user_role_v2(p_user_id) IN ('owner', 'admin', 'funcionario', 'employee', 'coordenacao', 'contabilidade'); END;
$$;

-- can_access_url_v2
CREATE OR REPLACE FUNCTION public.can_access_url_v2(p_url TEXT, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
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

-- log_security_event_v2
CREATE OR REPLACE FUNCTION public.log_security_event_v2(
    p_event_type TEXT, p_user_id UUID DEFAULT NULL, p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL, p_risk_score INTEGER DEFAULT 0,
    p_details JSONB DEFAULT NULL, p_fingerprint TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID; v_email TEXT;
BEGIN
    IF p_user_id IS NOT NULL THEN SELECT email INTO v_email FROM auth.users WHERE id = p_user_id; END IF;
    INSERT INTO public.security_events_v2 (user_id, user_email, event_type, ip_address, user_agent, risk_score, details, fingerprint, is_blocked)
    VALUES (COALESCE(p_user_id, auth.uid()), v_email, p_event_type, p_ip_address, p_user_agent, p_risk_score, p_details, p_fingerprint, p_risk_score >= 80)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- log_audit_v2
CREATE OR REPLACE FUNCTION public.log_audit_v2(
    p_action TEXT, p_category TEXT DEFAULT 'general', p_table_name TEXT DEFAULT NULL,
    p_record_id TEXT DEFAULT NULL, p_old_data JSONB DEFAULT NULL, p_new_data JSONB DEFAULT NULL,
    p_severity public.security_severity DEFAULT 'info', p_metadata JSONB DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID; v_user_id UUID := auth.uid(); v_email TEXT; v_role TEXT;
BEGIN
    IF v_user_id IS NOT NULL THEN
        SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
        v_role := public.get_user_role_v2(v_user_id);
    END IF;
    INSERT INTO public.security_audit_log (user_id, user_email, user_role, action, action_category, table_name, record_id, old_data, new_data, severity, metadata)
    VALUES (v_user_id, v_email, v_role, p_action, p_category, p_table_name, p_record_id, p_old_data, p_new_data, p_severity, p_metadata)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- check_rate_limit_v2
CREATE OR REPLACE FUNCTION public.check_rate_limit_v2(
    p_identifier TEXT, p_endpoint TEXT, p_max_requests INTEGER DEFAULT 100,
    p_window_seconds INTEGER DEFAULT 60, p_block_seconds INTEGER DEFAULT 300
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_state RECORD; v_now TIMESTAMPTZ := now(); v_window_start TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_state FROM public.rate_limit_state WHERE identifier = p_identifier AND endpoint = p_endpoint;
    IF v_state.blocked_until IS NOT NULL AND v_state.blocked_until > v_now THEN
        RETURN jsonb_build_object('allowed', false, 'blocked', true, 'remaining', 0, 'retry_after_seconds', EXTRACT(EPOCH FROM (v_state.blocked_until - v_now))::INTEGER);
    END IF;
    v_window_start := v_now - (p_window_seconds || ' seconds')::INTERVAL;
    IF v_state IS NULL OR v_state.window_start < v_window_start THEN
        INSERT INTO public.rate_limit_state (identifier, endpoint, request_count, window_start)
        VALUES (p_identifier, p_endpoint, 1, v_now)
        ON CONFLICT (identifier, endpoint) DO UPDATE SET request_count = 1, window_start = v_now, blocked_until = NULL, updated_at = v_now;
        RETURN jsonb_build_object('allowed', true, 'blocked', false, 'remaining', p_max_requests - 1);
    END IF;
    IF v_state.request_count >= p_max_requests THEN
        UPDATE public.rate_limit_state SET blocked_until = v_now + (p_block_seconds || ' seconds')::INTERVAL, total_blocked_count = total_blocked_count + 1, updated_at = v_now
        WHERE identifier = p_identifier AND endpoint = p_endpoint;
        RETURN jsonb_build_object('allowed', false, 'blocked', true, 'remaining', 0, 'retry_after_seconds', p_block_seconds);
    END IF;
    UPDATE public.rate_limit_state SET request_count = request_count + 1, updated_at = v_now WHERE identifier = p_identifier AND endpoint = p_endpoint;
    RETURN jsonb_build_object('allowed', true, 'blocked', false, 'remaining', p_max_requests - v_state.request_count - 1);
END;
$$;

-- check_webhook_idempotency_v2
CREATE OR REPLACE FUNCTION public.check_webhook_idempotency_v2(
    p_provider TEXT, p_event_id TEXT, p_event_type TEXT DEFAULT NULL,
    p_payload JSONB DEFAULT NULL, p_ip_address INET DEFAULT NULL, p_signature_valid BOOLEAN DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_existing RECORD;
BEGIN
    SELECT * INTO v_existing FROM public.webhook_events_v2 WHERE provider = p_provider AND event_id = p_event_id;
    IF v_existing IS NOT NULL THEN
        UPDATE public.webhook_events_v2 SET status = 'duplicate', attempts = attempts + 1 WHERE id = v_existing.id;
        RETURN jsonb_build_object('is_duplicate', true, 'original_id', v_existing.id, 'original_status', v_existing.status);
    END IF;
    INSERT INTO public.webhook_events_v2 (provider, event_id, event_type, payload, ip_address, signature_valid)
    VALUES (p_provider, p_event_id, p_event_type, p_payload, p_ip_address, p_signature_valid);
    RETURN jsonb_build_object('is_duplicate', false, 'event_id', p_event_id, 'status', 'received');
END;
$$;

-- validate_session_v2
CREATE OR REPLACE FUNCTION public.validate_session_v2(p_session_token UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_session RECORD; v_now TIMESTAMPTZ := now();
BEGIN
    SELECT * INTO v_session FROM public.active_sessions WHERE session_token = p_session_token;
    IF v_session IS NULL THEN RETURN jsonb_build_object('valid', false, 'reason', 'session_not_found'); END IF;
    IF v_session.status != 'active' THEN RETURN jsonb_build_object('valid', false, 'reason', 'session_' || v_session.status); END IF;
    IF v_session.expires_at < v_now THEN
        UPDATE public.active_sessions SET status = 'expired' WHERE id = v_session.id;
        RETURN jsonb_build_object('valid', false, 'reason', 'session_expired');
    END IF;
    UPDATE public.active_sessions SET last_activity_at = v_now WHERE id = v_session.id;
    RETURN jsonb_build_object('valid', true, 'user_id', v_session.user_id, 'device_hash', v_session.device_hash, 'mfa_verified', v_session.mfa_verified, 'expires_at', v_session.expires_at);
END;
$$;

-- revoke_other_sessions_v2
CREATE OR REPLACE FUNCTION public.revoke_other_sessions_v2(p_user_id UUID, p_current_session_token UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER;
BEGIN
    UPDATE public.active_sessions SET status = 'revoked', revoked_at = now(), revoked_reason = 'new_session_login'
    WHERE user_id = p_user_id AND session_token != p_current_session_token AND status = 'active';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- audit_rls_coverage_v2
CREATE OR REPLACE FUNCTION public.audit_rls_coverage_v2()
RETURNS TABLE (table_name TEXT, rls_enabled BOOLEAN, policy_count BIGINT, has_select_policy BOOLEAN, has_insert_policy BOOLEAN, has_update_policy BOOLEAN, has_delete_policy BOOLEAN, risk_level TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT t.tablename::TEXT, t.rowsecurity, COALESCE(p.policy_count, 0)::BIGINT,
        COALESCE(p.has_select, false), COALESCE(p.has_insert, false), COALESCE(p.has_update, false), COALESCE(p.has_delete, false),
        CASE WHEN NOT t.rowsecurity THEN 'CRITICAL' WHEN COALESCE(p.policy_count, 0) = 0 THEN 'HIGH' WHEN NOT COALESCE(p.has_select, false) THEN 'MEDIUM' ELSE 'LOW' END::TEXT
    FROM pg_tables t
    LEFT JOIN (SELECT pol.tablename, COUNT(*) as policy_count,
        BOOL_OR(pol.cmd = 'SELECT' OR pol.cmd = '*') as has_select,
        BOOL_OR(pol.cmd = 'INSERT' OR pol.cmd = '*') as has_insert,
        BOOL_OR(pol.cmd = 'UPDATE' OR pol.cmd = '*') as has_update,
        BOOL_OR(pol.cmd = 'DELETE' OR pol.cmd = '*') as has_delete
        FROM pg_policies pol WHERE pol.schemaname = 'public' GROUP BY pol.tablename) p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public' AND t.tablename NOT LIKE 'pg_%'
    ORDER BY CASE WHEN NOT t.rowsecurity THEN 1 WHEN COALESCE(p.policy_count, 0) = 0 THEN 2 ELSE 3 END, t.tablename;
END;
$$;

-- PARTE 6: CLEANUP FUNCTIONS
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits_v3()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER;
BEGIN DELETE FROM public.rate_limit_state WHERE updated_at < now() - INTERVAL '1 day'; GET DIAGNOSTICS v_count = ROW_COUNT; RETURN v_count; END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions_v2()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER;
BEGIN
    UPDATE public.active_sessions SET status = 'expired' WHERE status = 'active' AND expires_at < now();
    GET DIAGNOSTICS v_count = ROW_COUNT;
    DELETE FROM public.active_sessions WHERE created_at < now() - INTERVAL '30 days';
    RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_security_events_v2()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER;
BEGIN DELETE FROM public.security_events_v2 WHERE resolved = true AND resolved_at < now() - INTERVAL '90 days'; GET DIAGNOSTICS v_count = ROW_COUNT; RETURN v_count; END;
$$;

-- PARTE 7: TRIGGER user_roles
CREATE OR REPLACE FUNCTION public.audit_role_changes_v2()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    PERFORM public.log_audit_v2('role_changed', 'security', 'user_roles', COALESCE(NEW.user_id, OLD.user_id)::TEXT,
        CASE WHEN OLD IS NOT NULL THEN jsonb_build_object('role', OLD.role) ELSE NULL END,
        CASE WHEN NEW IS NOT NULL THEN jsonb_build_object('role', NEW.role) ELSE NULL END,
        'critical'::public.security_severity, jsonb_build_object('operation', TG_OP, 'changed_by', auth.uid()));
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_role_changes_v2 ON public.user_roles;
CREATE TRIGGER trigger_audit_role_changes_v2 AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes_v2();

-- PARTE 8: COMENTÁRIOS
COMMENT ON TABLE public.security_audit_log IS '🛡️ FORTALEZA DIGITAL: Log de auditoria imutável';
COMMENT ON TABLE public.security_events_v2 IS '🛡️ FORTALEZA DIGITAL: Eventos de segurança';
COMMENT ON TABLE public.rate_limit_state IS '🛡️ FORTALEZA DIGITAL: Estado do rate limiting';
COMMENT ON TABLE public.webhook_events_v2 IS '🛡️ FORTALEZA DIGITAL: Idempotência de webhooks';
COMMENT ON TABLE public.content_access_log IS '🛡️ FORTALEZA DIGITAL: Logs de acesso a conteúdo';
COMMENT ON TABLE public.active_sessions IS '🛡️ FORTALEZA DIGITAL: Sessões ativas';
COMMENT ON FUNCTION public.get_user_role_v2 IS '🛡️ Retorna role do usuário via user_roles';
COMMENT ON FUNCTION public.check_rate_limit_v2 IS '🛡️ Rate limiting com blocking';
COMMENT ON FUNCTION public.log_security_event_v2 IS '🛡️ Registrar evento de segurança';
COMMENT ON FUNCTION public.log_audit_v2 IS '🛡️ Registrar evento de auditoria';
COMMENT ON FUNCTION public.audit_rls_coverage_v2 IS '🛡️ Auditar cobertura RLS';
