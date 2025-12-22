-- ============================================================
-- 🛡️ MIGRAÇÃO DE SEGURANÇA v4 - CORRIGIR OVERLOADS
-- ============================================================

-- 1. cleanup_old_security_events (versão sem parâmetros)
DROP FUNCTION IF EXISTS public.cleanup_old_security_events();

CREATE FUNCTION public.cleanup_old_security_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN public.cleanup_old_security_events(90);
END;
$$;

-- 2. mark_webhook_processed (overload com 5 params)
DROP FUNCTION IF EXISTS public.mark_webhook_processed(TEXT, TEXT, TEXT, JSONB, TEXT);

CREATE FUNCTION public.mark_webhook_processed(
  p_provider TEXT,
  p_event_id TEXT,
  p_status TEXT,
  p_response JSONB,
  p_error TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.webhooks_queue 
  SET 
    status = p_status,
    processed_at = NOW(),
    attempts = attempts + 1,
    error = p_error
  WHERE source = p_provider AND external_event_id = p_event_id;
  RETURN FOUND;
END;
$$;

-- 3. revoke_other_sessions_v2 (overload com 2 params UUID)
DROP FUNCTION IF EXISTS public.revoke_other_sessions_v2(UUID, UUID);

CREATE FUNCTION public.revoke_other_sessions_v2(
  p_user_id UUID,
  p_current_session_token UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_revoked INTEGER;
BEGIN
  UPDATE public.active_sessions
  SET 
    status = 'revoked',
    revoked_at = NOW(),
    revoked_reason = 'new_login'
  WHERE user_id = p_user_id
    AND id != p_current_session_token
    AND status = 'active';
  GET DIAGNOSTICS v_revoked = ROW_COUNT;
  RETURN v_revoked;
END;
$$;

-- 4. validate_session_v2 (overload com UUID)
DROP FUNCTION IF EXISTS public.validate_session_v2(UUID);

CREATE FUNCTION public.validate_session_v2(
  p_session_token UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT * INTO v_session
  FROM public.active_sessions
  WHERE id = p_session_token
    AND status = 'active'
    AND expires_at > NOW();
  
  IF v_session IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'session_not_found');
  END IF;
  
  UPDATE public.active_sessions
  SET last_activity_at = NOW()
  WHERE id = v_session.id;
  
  RETURN jsonb_build_object(
    'valid', true,
    'user_id', v_session.user_id,
    'device_hash', v_session.device_hash,
    'expires_at', v_session.expires_at
  );
END;
$$;