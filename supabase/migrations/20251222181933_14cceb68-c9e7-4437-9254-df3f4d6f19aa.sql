
-- FUNÇÕES FINAIS SEM COMENTÁRIOS PROBLEMÁTICOS
CREATE OR REPLACE FUNCTION public.fortress_rate_limit(
    p_identifier TEXT, p_endpoint TEXT, p_max_requests INTEGER DEFAULT 100, p_window_seconds INTEGER DEFAULT 60, p_block_seconds INTEGER DEFAULT 300
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_state RECORD; v_now TIMESTAMPTZ := now(); v_window_start TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_state FROM public.rate_limit_state WHERE identifier = p_identifier AND endpoint = p_endpoint;
    IF v_state.blocked_until IS NOT NULL AND v_state.blocked_until > v_now THEN
        RETURN jsonb_build_object('allowed', false, 'blocked', true, 'blocked_until', v_state.blocked_until, 'remaining', 0);
    END IF;
    v_window_start := v_now - (p_window_seconds || ' seconds')::INTERVAL;
    IF v_state IS NULL OR v_state.window_start < v_window_start THEN
        INSERT INTO public.rate_limit_state (identifier, endpoint, request_count, window_start) VALUES (p_identifier, p_endpoint, 1, v_now)
        ON CONFLICT (identifier, endpoint) DO UPDATE SET request_count = 1, window_start = v_now, blocked_until = NULL, updated_at = v_now;
        RETURN jsonb_build_object('allowed', true, 'blocked', false, 'remaining', p_max_requests - 1);
    END IF;
    IF v_state.request_count >= p_max_requests THEN
        UPDATE public.rate_limit_state SET blocked_until = v_now + (p_block_seconds || ' seconds')::INTERVAL, total_blocked_count = total_blocked_count + 1, updated_at = v_now WHERE identifier = p_identifier AND endpoint = p_endpoint;
        RETURN jsonb_build_object('allowed', false, 'blocked', true, 'remaining', 0, 'retry_after_seconds', p_block_seconds);
    END IF;
    UPDATE public.rate_limit_state SET request_count = request_count + 1, updated_at = v_now WHERE identifier = p_identifier AND endpoint = p_endpoint;
    RETURN jsonb_build_object('allowed', true, 'blocked', false, 'remaining', p_max_requests - v_state.request_count - 1);
END; $$;

CREATE OR REPLACE FUNCTION public.fortress_webhook_check(p_provider TEXT, p_event_id TEXT, p_event_type TEXT DEFAULT NULL, p_payload JSONB DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_existing RECORD;
BEGIN
    SELECT * INTO v_existing FROM public.webhook_events WHERE provider = p_provider AND event_id = p_event_id;
    IF v_existing IS NOT NULL THEN
        UPDATE public.webhook_events SET status = 'duplicate', attempts = attempts + 1 WHERE id = v_existing.id;
        RETURN jsonb_build_object('is_duplicate', true, 'original_id', v_existing.id);
    END IF;
    INSERT INTO public.webhook_events (provider, event_id, event_type, payload) VALUES (p_provider, p_event_id, p_event_type, p_payload);
    RETURN jsonb_build_object('is_duplicate', false, 'event_id', p_event_id, 'status', 'received');
END; $$;

CREATE OR REPLACE FUNCTION public.fortress_session_validate(p_session_token UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_session RECORD; v_now TIMESTAMPTZ := now();
BEGIN
    SELECT * INTO v_session FROM public.active_sessions WHERE session_token = p_session_token;
    IF v_session IS NULL THEN RETURN jsonb_build_object('valid', false, 'reason', 'not_found'); END IF;
    IF v_session.status != 'active' THEN RETURN jsonb_build_object('valid', false, 'reason', v_session.status); END IF;
    IF v_session.expires_at < v_now THEN UPDATE public.active_sessions SET status = 'expired' WHERE id = v_session.id; RETURN jsonb_build_object('valid', false, 'reason', 'expired'); END IF;
    UPDATE public.active_sessions SET last_activity_at = v_now WHERE id = v_session.id;
    RETURN jsonb_build_object('valid', true, 'user_id', v_session.user_id, 'device_hash', v_session.device_hash);
END; $$;

CREATE OR REPLACE FUNCTION public.fortress_session_revoke_others(p_user_id UUID, p_current_token UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_count INTEGER;
BEGIN
    UPDATE public.active_sessions SET status = 'revoked', revoked_at = now(), revoked_reason = 'new_login' WHERE user_id = p_user_id AND session_token != p_current_token AND status = 'active';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END; $$;

CREATE OR REPLACE FUNCTION public.fortress_rls_audit()
RETURNS TABLE (tbl TEXT, rls_on BOOLEAN, policies BIGINT, risk TEXT) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    RETURN QUERY SELECT t.tablename::TEXT, t.rowsecurity, COALESCE(p.cnt, 0)::BIGINT, CASE WHEN NOT t.rowsecurity THEN 'CRITICAL' WHEN COALESCE(p.cnt, 0) = 0 THEN 'HIGH' ELSE 'LOW' END::TEXT
    FROM pg_tables t LEFT JOIN (SELECT pol.tablename, COUNT(*) as cnt FROM pg_policies pol WHERE pol.schemaname = 'public' GROUP BY pol.tablename) p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public' ORDER BY CASE WHEN NOT t.rowsecurity THEN 1 WHEN COALESCE(p.cnt, 0) = 0 THEN 2 ELSE 3 END;
END; $$;
