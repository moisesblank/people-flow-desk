-- ============================================
-- 🛡️ SECURITY FORTRESS ULTRA - PARTE 4
-- Funções com nomes únicos para evitar conflito
-- ============================================

-- ============================================
-- FUNÇÃO: log_security_audit - Registrar auditoria
-- ============================================

CREATE OR REPLACE FUNCTION public.log_security_audit(
    p_action TEXT,
    p_category TEXT DEFAULT 'general',
    p_table_name TEXT DEFAULT NULL,
    p_record_id TEXT DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_severity TEXT DEFAULT 'info',
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
    v_user_id UUID := auth.uid();
    v_email TEXT;
    v_role TEXT;
BEGIN
    IF v_user_id IS NOT NULL THEN
        SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
        v_role := public.get_user_role_v2(v_user_id);
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

-- ============================================
-- FUNÇÃO: check_advanced_rate_limit - Rate limiting avançado
-- ============================================

CREATE OR REPLACE FUNCTION public.check_advanced_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_max_requests INTEGER DEFAULT 100,
    p_window_seconds INTEGER DEFAULT 60,
    p_block_seconds INTEGER DEFAULT 300
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_state RECORD;
    v_now TIMESTAMPTZ := now();
    v_window_start TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_state
    FROM public.rate_limit_state
    WHERE identifier = p_identifier AND endpoint = p_endpoint;
    
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
    
    IF v_state.request_count >= p_max_requests THEN
        UPDATE public.rate_limit_state
        SET blocked_until = v_now + (p_block_seconds || ' seconds')::INTERVAL,
            total_blocked_count = total_blocked_count + 1,
            updated_at = v_now
        WHERE identifier = p_identifier AND endpoint = p_endpoint;
        
        RETURN jsonb_build_object(
            'allowed', false,
            'blocked', true,
            'blocked_until', v_now + (p_block_seconds || ' seconds')::INTERVAL,
            'remaining', 0,
            'retry_after_seconds', p_block_seconds
        );
    END IF;
    
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

-- ============================================
-- FUNÇÃO: check_webhook_idempotency
-- ============================================

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
SET search_path = public
AS $$
DECLARE
    v_existing RECORD;
BEGIN
    SELECT * INTO v_existing
    FROM public.webhook_events
    WHERE provider = p_provider AND event_id = p_event_id;
    
    IF v_existing IS NOT NULL THEN
        UPDATE public.webhook_events
        SET status = 'duplicate',
            attempts = attempts + 1
        WHERE id = v_existing.id;
        
        RETURN jsonb_build_object(
            'is_duplicate', true,
            'original_id', v_existing.id,
            'original_status', v_existing.status,
            'processed_at', v_existing.processed_at
        );
    END IF;
    
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

-- ============================================
-- FUNÇÃO: mark_webhook_processed
-- ============================================

CREATE OR REPLACE FUNCTION public.mark_webhook_processed(
    p_provider TEXT,
    p_event_id TEXT,
    p_response JSONB DEFAULT NULL,
    p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.webhook_events
    SET 
        status = CASE WHEN p_error IS NULL THEN 'processed' ELSE 'failed' END,
        processed_at = now(),
        response = p_response,
        last_error = p_error
    WHERE provider = p_provider AND event_id = p_event_id;
    
    RETURN FOUND;
END;
$$;

-- ============================================
-- FUNÇÃO: cleanup_security_data - Limpeza geral
-- ============================================

CREATE OR REPLACE FUNCTION public.cleanup_security_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rate_limits INTEGER;
    v_webhooks INTEGER;
BEGIN
    -- Limpar rate limits antigos
    WITH deleted AS (
        DELETE FROM public.rate_limit_state
        WHERE updated_at < now() - INTERVAL '1 hour'
        RETURNING id
    )
    SELECT COUNT(*) INTO v_rate_limits FROM deleted;
    
    -- Limpar webhooks processados antigos
    WITH deleted AS (
        DELETE FROM public.webhook_events
        WHERE status IN ('processed', 'ignored', 'duplicate')
        AND received_at < now() - INTERVAL '30 days'
        RETURNING id
    )
    SELECT COUNT(*) INTO v_webhooks FROM deleted;
    
    RETURN jsonb_build_object(
        'rate_limits_cleaned', v_rate_limits,
        'webhooks_cleaned', v_webhooks,
        'cleaned_at', now()
    );
END;
$$;

-- ============================================
-- FUNÇÃO: get_url_access_result
-- ============================================

CREATE OR REPLACE FUNCTION public.get_url_access_result(
    p_url TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := COALESCE(p_user_id, auth.uid());
    v_role TEXT;
    v_allowed BOOLEAN;
    v_reason TEXT;
    v_redirect TEXT;
BEGIN
    v_role := public.get_user_role_v2(v_uid);
    v_allowed := public.can_access_url(p_url, v_uid);
    
    IF v_allowed THEN
        v_reason := 'access_granted';
        v_redirect := NULL;
    ELSE
        IF v_uid IS NULL THEN
            v_reason := 'not_authenticated';
            v_redirect := '/auth';
        ELSIF v_role = 'beta' AND NOT (p_url LIKE '/alunos%') THEN
            v_reason := 'beta_restricted';
            v_redirect := '/alunos';
        ELSIF v_role IN ('funcionario', 'employee') AND (p_url LIKE '/alunos%') THEN
            v_reason := 'employee_restricted';
            v_redirect := '/';
        ELSE
            v_reason := 'insufficient_permissions';
            v_redirect := '/';
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'allowed', v_allowed,
        'reason', v_reason,
        'redirect_to', v_redirect,
        'user_role', v_role,
        'requested_url', p_url
    );
END;
$$;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION public.log_security_audit IS 'Registra evento de auditoria no security_audit_log';
COMMENT ON FUNCTION public.check_advanced_rate_limit IS 'Verifica e aplica rate limiting com bloqueio';
COMMENT ON FUNCTION public.check_webhook_idempotency IS 'Verifica duplicação de webhook (anti-replay)';
COMMENT ON FUNCTION public.mark_webhook_processed IS 'Marca webhook como processado ou falho';
COMMENT ON FUNCTION public.cleanup_security_data IS 'Limpa dados de segurança antigos';
COMMENT ON FUNCTION public.get_url_access_result IS 'Retorna resultado completo de verificação de acesso';