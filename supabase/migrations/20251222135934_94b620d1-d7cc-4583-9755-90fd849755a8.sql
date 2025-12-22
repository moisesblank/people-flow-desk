
-- 🛡️ FORTALEZA SUPREME v3.0 FINAL
-- Usando is_owner(auth.uid()) explícito

-- Enums
DO $$ BEGIN CREATE TYPE public.threat_level AS ENUM ('none', 'low', 'medium', 'high', 'critical', 'emergency'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.attack_type AS ENUM ('brute_force', 'credential_stuffing', 'session_hijacking', 'privilege_escalation', 'sql_injection', 'xss_attempt', 'ddos', 'bot_attack', 'api_abuse', 'data_exfiltration'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.security_action AS ENUM ('allow', 'challenge', 'rate_limit', 'block_temp', 'block_perm', 'alert_admin', 'quarantine'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Threat Intelligence
CREATE TABLE IF NOT EXISTS public.threat_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET,
    user_id UUID,
    device_fingerprint TEXT,
    threat_level public.threat_level DEFAULT 'none',
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    blocked_until TIMESTAMPTZ,
    total_violations INTEGER DEFAULT 0,
    last_violation_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_threat_ip ON public.threat_intelligence(ip_address);
CREATE INDEX IF NOT EXISTS idx_threat_user ON public.threat_intelligence(user_id);
CREATE INDEX IF NOT EXISTS idx_threat_blocked ON public.threat_intelligence(blocked_until) WHERE blocked_until IS NOT NULL;

-- Rate Limit Config
CREATE TABLE IF NOT EXISTS public.rate_limit_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL,
    role TEXT DEFAULT 'anonymous',
    requests_per_minute INTEGER DEFAULT 60,
    requests_per_hour INTEGER DEFAULT 1000,
    burst_limit INTEGER DEFAULT 10,
    cooldown_seconds INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(endpoint, role)
);

INSERT INTO public.rate_limit_config (endpoint, role, requests_per_minute, requests_per_hour, burst_limit) VALUES
    ('auth/*', 'anonymous', 5, 20, 3),
    ('auth/*', 'beta', 30, 200, 10),
    ('auth/*', 'funcionario', 60, 500, 20),
    ('auth/*', 'owner', 1000, 10000, 100),
    ('api/*', 'anonymous', 20, 100, 5),
    ('api/*', 'beta', 100, 1000, 20),
    ('api/*', 'funcionario', 200, 2000, 50),
    ('api/*', 'owner', 5000, 50000, 500),
    ('content/*', 'beta', 50, 500, 10),
    ('content/*', 'funcionario', 100, 1000, 20),
    ('content/*', 'owner', 5000, 50000, 500),
    ('upload/*', 'beta', 10, 50, 3),
    ('upload/*', 'funcionario', 30, 200, 10),
    ('upload/*', 'owner', 1000, 10000, 100)
ON CONFLICT (endpoint, role) DO NOTHING;

-- Rate Limit Realtime
CREATE TABLE IF NOT EXISTS public.rate_limit_realtime (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    request_count INTEGER DEFAULT 1,
    last_request_at TIMESTAMPTZ DEFAULT NOW(),
    is_throttled BOOLEAN DEFAULT FALSE,
    throttle_until TIMESTAMPTZ,
    violation_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ratelimit_identifier ON public.rate_limit_realtime(identifier);
CREATE INDEX IF NOT EXISTS idx_ratelimit_endpoint ON public.rate_limit_realtime(endpoint);
CREATE INDEX IF NOT EXISTS idx_ratelimit_throttled ON public.rate_limit_realtime(is_throttled) WHERE is_throttled = TRUE;

-- URL Access Rules (MAPA DEFINITIVO)
CREATE TABLE IF NOT EXISTS public.url_access_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_pattern TEXT NOT NULL,
    domain TEXT NOT NULL,
    allowed_roles TEXT[] NOT NULL,
    require_valid_subscription BOOLEAN DEFAULT FALSE,
    require_mfa BOOLEAN DEFAULT FALSE,
    max_risk_score INTEGER DEFAULT 100,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.url_access_rules (url_pattern, domain, allowed_roles, require_valid_subscription, description, priority) VALUES
    ('/', 'pro.moisesmedeiros.com.br', ARRAY['anonymous', 'beta', 'funcionario', 'owner'], FALSE, '🌐 Página inicial pública', 1),
    ('/auth', 'pro.moisesmedeiros.com.br', ARRAY['anonymous', 'beta', 'funcionario', 'owner'], FALSE, '🌐 Autenticação', 1),
    ('/auth/*', 'pro.moisesmedeiros.com.br', ARRAY['anonymous', 'beta', 'funcionario', 'owner'], FALSE, '🌐 Rotas auth', 1),
    ('/alunos', 'pro.moisesmedeiros.com.br', ARRAY['beta', 'owner'], TRUE, '👨‍🎓 Portal aluno', 10),
    ('/alunos/*', 'pro.moisesmedeiros.com.br', ARRAY['beta', 'owner'], TRUE, '👨‍🎓 Área aluno', 10),
    ('/aulas', 'pro.moisesmedeiros.com.br', ARRAY['beta', 'owner'], TRUE, '👨‍🎓 Aulas', 10),
    ('/aulas/*', 'pro.moisesmedeiros.com.br', ARRAY['beta', 'owner'], TRUE, '👨‍🎓 Conteúdo aulas', 10),
    ('/materiais', 'pro.moisesmedeiros.com.br', ARRAY['beta', 'owner'], TRUE, '👨‍🎓 Materiais', 10),
    ('/materiais/*', 'pro.moisesmedeiros.com.br', ARRAY['beta', 'owner'], TRUE, '👨‍🎓 Download materiais', 10),
    ('/', 'gestao.moisesmedeiros.com.br', ARRAY['funcionario', 'coordenacao', 'admin', 'owner'], FALSE, '👔 Dashboard gestão', 20),
    ('/*', 'gestao.moisesmedeiros.com.br', ARRAY['funcionario', 'coordenacao', 'admin', 'owner'], FALSE, '👔 Área gestão', 20),
    ('/dashboard', 'gestao.moisesmedeiros.com.br', ARRAY['funcionario', 'coordenacao', 'admin', 'owner'], FALSE, '👔 Dashboard', 20),
    ('/financeiro', 'gestao.moisesmedeiros.com.br', ARRAY['coordenacao', 'admin', 'owner'], FALSE, '👔 Financeiro', 25),
    ('/relatorios', 'gestao.moisesmedeiros.com.br', ARRAY['coordenacao', 'admin', 'owner'], FALSE, '👔 Relatórios', 25),
    ('/*', '*', ARRAY['owner'], FALSE, '👑 Owner acesso total', 100)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_url_rules_domain ON public.url_access_rules(domain);
CREATE INDEX IF NOT EXISTS idx_url_rules_active ON public.url_access_rules(is_active) WHERE is_active = TRUE;

-- Security Log Immutable
CREATE TABLE IF NOT EXISTS public.security_log_immutable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    user_id UUID,
    session_id UUID,
    ip_address INET,
    device_fingerprint TEXT,
    user_agent TEXT,
    url TEXT,
    threat_level public.threat_level DEFAULT 'none',
    risk_score INTEGER DEFAULT 0,
    action_taken public.security_action DEFAULT 'allow',
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_security_log_created ON public.security_log_immutable(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_log_user ON public.security_log_immutable(user_id);
CREATE INDEX IF NOT EXISTS idx_security_log_type ON public.security_log_immutable(event_type);

-- Performance Metrics
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL,
    endpoint TEXT,
    response_time_ms INTEGER,
    concurrent_users INTEGER,
    error_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    cache_hit_ratio NUMERIC(5,4),
    measured_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_perf_measured ON public.performance_metrics(measured_at DESC);

-- RLS (usando auth.uid() explícito)
ALTER TABLE public.threat_intelligence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner manage threat" ON public.threat_intelligence;
CREATE POLICY "Owner manage threat" ON public.threat_intelligence FOR ALL TO authenticated USING (public.is_owner(auth.uid()));

ALTER TABLE public.rate_limit_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner manage rate config" ON public.rate_limit_config;
CREATE POLICY "Owner manage rate config" ON public.rate_limit_config FOR ALL TO authenticated USING (public.is_owner(auth.uid()));

ALTER TABLE public.rate_limit_realtime ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin view rate realtime" ON public.rate_limit_realtime;
CREATE POLICY "Admin view rate realtime" ON public.rate_limit_realtime FOR SELECT TO authenticated USING (public.is_owner(auth.uid()));

ALTER TABLE public.url_access_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner manage url rules" ON public.url_access_rules;
CREATE POLICY "Owner manage url rules" ON public.url_access_rules FOR ALL TO authenticated USING (public.is_owner(auth.uid()));

ALTER TABLE public.security_log_immutable ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin view security logs" ON public.security_log_immutable;
CREATE POLICY "Admin view security logs" ON public.security_log_immutable FOR SELECT TO authenticated USING (public.is_owner(auth.uid()));

ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin view perf metrics" ON public.performance_metrics;
CREATE POLICY "Admin view perf metrics" ON public.performance_metrics FOR SELECT TO authenticated USING (public.is_owner(auth.uid()));

-- Função de verificação de acesso URL
CREATE OR REPLACE FUNCTION public.check_url_access_v3(
    p_user_id UUID,
    p_url TEXT,
    p_domain TEXT DEFAULT 'pro.moisesmedeiros.com.br'
)
RETURNS TABLE(allowed BOOLEAN, reason TEXT, redirect_to TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_role TEXT;
    v_has_valid_subscription BOOLEAN;
    v_rule RECORD;
BEGIN
    IF public.is_owner(p_user_id) THEN
        RETURN QUERY SELECT TRUE, 'Owner access'::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    SELECT role INTO v_role FROM public.user_roles WHERE user_id = p_user_id LIMIT 1;
    IF v_role IS NULL THEN v_role := 'anonymous'; END IF;
    
    SELECT CASE WHEN access_expires_at IS NULL THEN TRUE WHEN access_expires_at > NOW() THEN TRUE ELSE FALSE END 
    INTO v_has_valid_subscription FROM public.profiles WHERE id = p_user_id;
    
    FOR v_rule IN 
        SELECT * FROM public.url_access_rules
        WHERE is_active = TRUE AND (domain = p_domain OR domain = '*')
        AND (p_url LIKE REPLACE(url_pattern, '*', '%') OR url_pattern = '/*')
        ORDER BY priority ASC, LENGTH(url_pattern) DESC LIMIT 1
    LOOP
        IF NOT (v_role = ANY(v_rule.allowed_roles)) THEN
            RETURN QUERY SELECT FALSE, 'Role not allowed'::TEXT, '/auth'::TEXT;
            RETURN;
        END IF;
        IF v_rule.require_valid_subscription AND NOT COALESCE(v_has_valid_subscription, FALSE) THEN
            RETURN QUERY SELECT FALSE, 'Subscription expired'::TEXT, '/renovar'::TEXT;
            RETURN;
        END IF;
        RETURN QUERY SELECT TRUE, 'Access granted'::TEXT, NULL::TEXT;
        RETURN;
    END LOOP;
    RETURN QUERY SELECT FALSE, 'No matching rule'::TEXT, '/auth'::TEXT;
END;
$$;

-- Função de rate limiting
CREATE OR REPLACE FUNCTION public.check_rate_limit_v3(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_role TEXT DEFAULT 'anonymous'
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, retry_after INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_config RECORD;
    v_count INTEGER;
    v_window TIMESTAMPTZ := date_trunc('minute', NOW());
BEGIN
    SELECT * INTO v_config FROM public.rate_limit_config 
    WHERE endpoint = p_endpoint AND role = p_role AND is_active = TRUE LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT TRUE, 60, 0;
        RETURN;
    END IF;
    
    INSERT INTO public.rate_limit_realtime (identifier, endpoint, window_start, request_count)
    VALUES (p_identifier, p_endpoint, v_window, 1)
    ON CONFLICT (identifier, endpoint, window_start) DO UPDATE SET request_count = rate_limit_realtime.request_count + 1
    RETURNING request_count INTO v_count;
    
    IF v_count > v_config.requests_per_minute THEN
        RETURN QUERY SELECT FALSE, 0, v_config.cooldown_seconds;
    ELSE
        RETURN QUERY SELECT TRUE, (v_config.requests_per_minute - v_count)::INTEGER, 0;
    END IF;
END;
$$;

-- Função de log de segurança
CREATE OR REPLACE FUNCTION public.log_security_v3(
    p_event_type TEXT,
    p_user_id UUID DEFAULT NULL,
    p_severity TEXT DEFAULT 'info',
    p_details JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_log_id UUID;
    v_risk_score INTEGER := 0;
    v_action public.security_action := 'allow';
    v_threat public.threat_level := 'none';
BEGIN
    CASE p_event_type
        WHEN 'login_failed' THEN v_risk_score := 10; v_threat := 'low';
        WHEN 'brute_force_detected' THEN v_risk_score := 50; v_threat := 'medium';
        WHEN 'privilege_escalation_attempt' THEN v_risk_score := 90; v_threat := 'critical';
        WHEN 'session_hijacking' THEN v_risk_score := 95; v_threat := 'critical';
        WHEN 'sql_injection' THEN v_risk_score := 100; v_threat := 'emergency';
        WHEN 'xss_attempt' THEN v_risk_score := 80; v_threat := 'high';
        WHEN 'rate_limit_exceeded' THEN v_risk_score := 30; v_threat := 'low';
        WHEN 'unauthorized_access' THEN v_risk_score := 60; v_threat := 'medium';
        ELSE v_risk_score := 0;
    END CASE;
    
    IF v_risk_score >= 90 THEN v_action := 'block_perm';
    ELSIF v_risk_score >= 70 THEN v_action := 'block_temp';
    ELSIF v_risk_score >= 50 THEN v_action := 'alert_admin';
    ELSIF v_risk_score >= 30 THEN v_action := 'rate_limit';
    END IF;
    
    INSERT INTO public.security_log_immutable (event_type, severity, user_id, threat_level, risk_score, action_taken, details)
    VALUES (p_event_type, p_severity, p_user_id, v_threat, v_risk_score, v_action, p_details)
    RETURNING id INTO v_log_id;
    
    IF v_risk_score >= 30 AND p_user_id IS NOT NULL THEN
        INSERT INTO public.threat_intelligence (user_id, risk_score, total_violations, last_violation_at, threat_level)
        VALUES (p_user_id, v_risk_score, 1, NOW(), v_threat)
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN v_log_id;
END;
$$;

-- Dashboard de segurança
CREATE OR REPLACE FUNCTION public.get_security_dashboard_v3()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN jsonb_build_object(
        'timestamp', NOW(),
        'active_threats', (SELECT COUNT(*) FROM public.threat_intelligence WHERE threat_level IN ('high', 'critical', 'emergency')),
        'blocked_users', (SELECT COUNT(*) FROM public.threat_intelligence WHERE blocked_until > NOW()),
        'rate_limited', (SELECT COUNT(DISTINCT identifier) FROM public.rate_limit_realtime WHERE is_throttled = TRUE AND throttle_until > NOW()),
        'events_1h', (SELECT COUNT(*) FROM public.security_log_immutable WHERE created_at > NOW() - INTERVAL '1 hour'),
        'critical_24h', (SELECT COUNT(*) FROM public.security_log_immutable WHERE severity = 'critical' AND created_at > NOW() - INTERVAL '24 hours'),
        'users_online', (SELECT COUNT(DISTINCT user_id) FROM public.active_sessions WHERE status = 'active' AND last_activity_at > NOW() - INTERVAL '5 minutes')
    );
END;
$$;

-- Limpeza automática
CREATE OR REPLACE FUNCTION public.cleanup_security_data_v3()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_logs INTEGER; v_rates INTEGER; v_metrics INTEGER;
BEGIN
    DELETE FROM public.security_log_immutable WHERE created_at < NOW() - INTERVAL '90 days' AND severity != 'critical';
    GET DIAGNOSTICS v_logs = ROW_COUNT;
    DELETE FROM public.rate_limit_realtime WHERE window_start < NOW() - INTERVAL '24 hours';
    GET DIAGNOSTICS v_rates = ROW_COUNT;
    DELETE FROM public.performance_metrics WHERE measured_at < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS v_metrics = ROW_COUNT;
    UPDATE public.threat_intelligence SET risk_score = GREATEST(0, risk_score - 10), threat_level = 'none'
    WHERE last_violation_at < NOW() - INTERVAL '7 days' AND threat_level != 'none';
    RETURN jsonb_build_object('logs', v_logs, 'rates', v_rates, 'metrics', v_metrics, 'at', NOW());
END;
$$;

-- Trigger proteção privilege escalation
CREATE OR REPLACE FUNCTION public.protect_privilege_escalation_v3()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
        IF NOT public.is_owner(auth.uid()) THEN
            PERFORM public.log_security_v3('privilege_escalation_attempt', auth.uid(), 'critical', 
                jsonb_build_object('target', NEW.user_id, 'attempted', NEW.role, 'original', OLD.role));
            RAISE EXCEPTION 'PRIVILEGE ESCALATION BLOCKED';
        END IF;
        PERFORM public.log_security_v3('role_changed', NEW.user_id, 'warning',
            jsonb_build_object('by', auth.uid(), 'from', OLD.role, 'to', NEW.role));
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_protect_privilege_v3 ON public.user_roles;
CREATE TRIGGER trigger_protect_privilege_v3 BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.protect_privilege_escalation_v3();

-- Trigger impedir deleção de logs
CREATE OR REPLACE FUNCTION public.prevent_log_deletion_v3()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY: Audit logs cannot be deleted';
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_log_delete_v3 ON public.security_log_immutable;
CREATE TRIGGER trigger_prevent_log_delete_v3 BEFORE DELETE ON public.security_log_immutable FOR EACH ROW EXECUTE FUNCTION public.prevent_log_deletion_v3();

-- Unique constraint para rate_limit_realtime
ALTER TABLE public.rate_limit_realtime DROP CONSTRAINT IF EXISTS rate_limit_realtime_identifier_endpoint_window_start_key;
ALTER TABLE public.rate_limit_realtime ADD CONSTRAINT rate_limit_realtime_unique UNIQUE (identifier, endpoint, window_start);

-- Comentários
COMMENT ON TABLE public.threat_intelligence IS '🛡️ FORTALEZA SUPREME v3.0 - Inteligência de ameaças 5000+ usuários';
COMMENT ON TABLE public.rate_limit_config IS '🛡️ FORTALEZA SUPREME v3.0 - Rate limiting por role/endpoint';
COMMENT ON TABLE public.url_access_rules IS '🛡️ FORTALEZA SUPREME v3.0 - MAPA DEFINITIVO URLs';
COMMENT ON TABLE public.security_log_immutable IS '🛡️ FORTALEZA SUPREME v3.0 - Logs imutáveis';
COMMENT ON TABLE public.performance_metrics IS '🛡️ FORTALEZA SUPREME v3.0 - Métricas performance';
COMMENT ON FUNCTION public.check_url_access_v3 IS '🛡️ Verificação acesso URL MAPA DEFINITIVO';
COMMENT ON FUNCTION public.check_rate_limit_v3 IS '🛡️ Rate limiting 5000+ usuários';
COMMENT ON FUNCTION public.log_security_v3 IS '🛡️ Logging segurança com risk score';
COMMENT ON FUNCTION public.get_security_dashboard_v3 IS '🛡️ Dashboard segurança tempo real';
