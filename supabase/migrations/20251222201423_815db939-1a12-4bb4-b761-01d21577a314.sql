
-- Criar TODAS as funções de uma vez, sem comentários condicionais
CREATE OR REPLACE FUNCTION public.check_webhook_idempotency_v3(
    p_provider TEXT, p_event_id TEXT, p_event_type TEXT DEFAULT NULL,
    p_payload JSONB DEFAULT NULL, p_ip_address TEXT DEFAULT NULL, p_signature_valid BOOLEAN DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_existing RECORD;
BEGIN
    SELECT * INTO v_existing FROM public.webhook_events WHERE provider = p_provider AND event_id = p_event_id;
    IF v_existing IS NOT NULL THEN
        UPDATE public.webhook_events SET status = 'duplicate', attempts = attempts + 1 WHERE id = v_existing.id;
        RETURN jsonb_build_object('is_duplicate', true, 'original_id', v_existing.id);
    END IF;
    INSERT INTO public.webhook_events (provider, event_id, event_type, payload, ip_address, signature_valid)
    VALUES (p_provider, p_event_id, p_event_type, p_payload, p_ip_address::INET, p_signature_valid);
    RETURN jsonb_build_object('is_duplicate', false, 'event_id', p_event_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_session_v3(p_session_token TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_session RECORD; v_now TIMESTAMPTZ := now();
BEGIN
    SELECT * INTO v_session FROM public.active_sessions WHERE session_token = p_session_token;
    IF v_session IS NULL THEN RETURN jsonb_build_object('valid', false, 'reason', 'not_found'); END IF;
    IF v_session.status != 'active' THEN RETURN jsonb_build_object('valid', false, 'reason', v_session.status); END IF;
    IF v_session.expires_at < v_now THEN
        UPDATE public.active_sessions SET status = 'expired' WHERE id = v_session.id;
        RETURN jsonb_build_object('valid', false, 'reason', 'expired');
    END IF;
    UPDATE public.active_sessions SET last_activity_at = v_now WHERE id = v_session.id;
    RETURN jsonb_build_object('valid', true, 'user_id', v_session.user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_user_sessions(p_user_id UUID, p_keep_session_token TEXT)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count INTEGER;
BEGIN
    UPDATE public.active_sessions SET status = 'revoked', revoked_at = now(), revoked_reason = 'new_session_login'
    WHERE user_id = p_user_id AND session_token != p_keep_session_token AND status = 'active';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.do_cleanup_rate_limits()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count INTEGER;
BEGIN
    DELETE FROM public.rate_limit_state WHERE updated_at < now() - INTERVAL '1 hour';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.do_cleanup_expired_sessions()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count INTEGER;
BEGIN
    UPDATE public.active_sessions SET status = 'expired' WHERE status = 'active' AND expires_at < now();
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;
