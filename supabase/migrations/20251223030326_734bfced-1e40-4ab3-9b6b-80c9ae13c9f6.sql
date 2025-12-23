-- ============================================
-- 🔥 FASE 5: CONTROLES C100-C104 + C030 (Borda/WAF/Rate Limit) - v3
-- ============================================

-- C100: Tabela de configuração de WAF/Borda centralizada
CREATE TABLE IF NOT EXISTS public.waf_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL UNIQUE,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('block_ip', 'block_path', 'rate_limit', 'geo_block', 'bot_protection', 'header_check')),
    pattern TEXT NOT NULL,
    action TEXT NOT NULL DEFAULT 'block' CHECK (action IN ('block', 'challenge', 'log', 'allow')),
    priority INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Regras padrão de WAF
INSERT INTO public.waf_config (rule_name, rule_type, pattern, action, priority)
VALUES 
    ('block_sql_injection', 'block_path', '.*(union|select|drop|delete|insert).*', 'block', 10),
    ('block_xss', 'block_path', '.*<script.*>.*', 'block', 10),
    ('block_path_traversal', 'block_path', '.*(\.\./|\.\.\\).*', 'block', 10),
    ('rate_limit_auth', 'rate_limit', '/auth/*', 'challenge', 50),
    ('rate_limit_api', 'rate_limit', '/api/*', 'log', 100),
    ('bot_protection_crawlers', 'bot_protection', '(bot|crawler|spider|scraper)', 'challenge', 80)
ON CONFLICT (rule_name) DO NOTHING;

-- RLS
ALTER TABLE public.waf_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waf_config_read" ON public.waf_config;
CREATE POLICY "waf_config_read" ON public.waf_config
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "waf_config_admin" ON public.waf_config;
CREATE POLICY "waf_config_admin" ON public.waf_config
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::TEXT IN ('owner', 'admin'))
    );

-- C101: Tabela de IPs bloqueados (blacklist dinâmica)
CREATE TABLE IF NOT EXISTS public.blocked_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    reason TEXT NOT NULL,
    blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    blocked_by UUID REFERENCES auth.users(id),
    is_permanent BOOLEAN DEFAULT false,
    violation_count INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::JSONB,
    UNIQUE(ip_address)
);

ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_ips_read" ON public.blocked_ips;
CREATE POLICY "blocked_ips_read" ON public.blocked_ips
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::TEXT IN ('owner', 'admin', 'employee'))
    );

DROP POLICY IF EXISTS "blocked_ips_admin" ON public.blocked_ips;
CREATE POLICY "blocked_ips_admin" ON public.blocked_ips
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::TEXT IN ('owner', 'admin'))
    );

-- C102: Função para verificar IP bloqueado
CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.blocked_ips
        WHERE ip_address = p_ip_address
          AND (expires_at IS NULL OR expires_at > now())
    );
END;
$$;

-- C103: Função para bloquear IP automaticamente com penalidade exponencial
CREATE OR REPLACE FUNCTION public.block_ip_auto(
    p_ip_address INET,
    p_reason TEXT,
    p_duration_hours INTEGER DEFAULT 24
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.blocked_ips (ip_address, reason, expires_at, is_permanent)
    VALUES (
        p_ip_address, 
        p_reason, 
        CASE WHEN p_duration_hours > 0 THEN now() + (p_duration_hours || ' hours')::INTERVAL ELSE NULL END,
        p_duration_hours <= 0
    )
    ON CONFLICT (ip_address) DO UPDATE SET
        violation_count = blocked_ips.violation_count + 1,
        expires_at = CASE 
            WHEN blocked_ips.violation_count >= 5 THEN NULL
            ELSE now() + ((24 * POWER(2, blocked_ips.violation_count)) || ' hours')::INTERVAL
        END,
        is_permanent = blocked_ips.violation_count >= 5,
        reason = p_reason
    RETURNING id INTO v_id;

    -- Logar evento
    INSERT INTO public.security_events (event_type, severity, source, payload, ip_address)
    VALUES (
        'IP_BLOCKED',
        'warn',
        'waf_auto',
        jsonb_build_object('ip', p_ip_address::TEXT, 'reason', p_reason),
        p_ip_address::TEXT
    );

    RETURN v_id;
END;
$$;

-- C104: Função de rate limit unificada com penalidade progressiva
CREATE OR REPLACE FUNCTION public.check_rate_limit_unified(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_limit INTEGER DEFAULT 60,
    p_window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE(
    allowed BOOLEAN,
    current_count INTEGER,
    remaining INTEGER,
    reset_at TIMESTAMPTZ,
    is_penalized BOOLEAN,
    penalty_multiplier INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_count INTEGER;
    v_penalty_count INTEGER;
    v_multiplier INTEGER := 1;
BEGIN
    v_window_start := date_trunc('minute', now()) - 
        ((EXTRACT(MINUTE FROM now())::INTEGER % GREATEST(1, p_window_seconds / 60)) || ' minutes')::INTERVAL;

    -- Verificar penalidades anteriores (últimas 24h)
    SELECT COUNT(*) INTO v_penalty_count
    FROM public.security_events
    WHERE payload->>'identifier' = p_identifier
      AND event_type = 'RATE_LIMIT_EXCEEDED'
      AND created_at > now() - INTERVAL '24 hours';

    -- Multiplicador de penalidade (2x, 4x, 8x...)
    IF v_penalty_count > 0 THEN
        v_multiplier := POWER(2, LEAST(v_penalty_count, 4))::INTEGER;
    END IF;

    -- Contar requisições na janela atual
    SELECT COALESCE(SUM(request_count), 0) INTO v_count
    FROM public.api_rate_limits
    WHERE client_id = p_identifier
      AND endpoint = p_endpoint
      AND window_start >= v_window_start;

    -- Verificar se excedeu (com limite reduzido por penalidade)
    IF v_count >= (p_limit / v_multiplier) THEN
        -- Logar violação
        INSERT INTO public.security_events (event_type, severity, source, payload)
        VALUES (
            'RATE_LIMIT_EXCEEDED',
            CASE WHEN v_penalty_count > 2 THEN 'error' ELSE 'warn' END,
            'rate_limiter',
            jsonb_build_object(
                'identifier', p_identifier,
                'endpoint', p_endpoint,
                'count', v_count,
                'limit', p_limit / v_multiplier,
                'penalty_multiplier', v_multiplier
            )
        );

        RETURN QUERY SELECT 
            false AS allowed,
            v_count AS current_count,
            0 AS remaining,
            v_window_start + (p_window_seconds || ' seconds')::INTERVAL AS reset_at,
            v_penalty_count > 0 AS is_penalized,
            v_multiplier AS penalty_multiplier;
        RETURN;
    END IF;

    -- Incrementar contador
    INSERT INTO public.api_rate_limits (client_id, endpoint, window_start, request_count)
    VALUES (p_identifier, p_endpoint, v_window_start, 1)
    ON CONFLICT (client_id, endpoint) 
    DO UPDATE SET request_count = api_rate_limits.request_count + 1;

    RETURN QUERY SELECT 
        true AS allowed,
        v_count + 1 AS current_count,
        GREATEST(0, (p_limit / v_multiplier) - v_count - 1) AS remaining,
        v_window_start + (p_window_seconds || ' seconds')::INTERVAL AS reset_at,
        v_penalty_count > 0 AS is_penalized,
        v_multiplier AS penalty_multiplier;
END;
$$;

-- C030: Headers de segurança obrigatórios (documentação para edge functions)
COMMENT ON TABLE public.waf_config IS 
'Configuração de WAF. Headers obrigatórios em edge functions:
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src self
Referrer-Policy: strict-origin-when-cross-origin';

-- Índices simples (sem predicados com funções)
CREATE INDEX IF NOT EXISTS idx_waf_config_active ON public.waf_config (is_active, rule_type);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON public.blocked_ips (ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_permanent ON public.blocked_ips (is_permanent) WHERE is_permanent = true;