-- DROP e recria a função com assinatura correta
DROP FUNCTION IF EXISTS public.validate_session_epoch(text);

CREATE OR REPLACE FUNCTION public.validate_session_epoch(p_session_token text)
RETURNS TABLE(
  status text,
  reason text,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_system RECORD;
  v_user_exists boolean;
  v_profile_active boolean;
BEGIN
  -- 1. Verificar system_guard
  SELECT auth_enabled, auth_epoch INTO v_system
  FROM public.system_guard
  LIMIT 1;

  IF v_system IS NULL OR NOT v_system.auth_enabled THEN
    RETURN QUERY SELECT 'invalid'::text, 'AUTH_LOCKDOWN'::text, NULL::uuid;
    RETURN;
  END IF;

  -- 2. Buscar sessão
  SELECT s.user_id, s.auth_epoch_at_login, s.status, s.last_activity_at, s.expires_at
  INTO v_session
  FROM public.active_sessions s
  WHERE s.session_token = p_session_token
    AND s.status = 'active';

  IF v_session IS NULL THEN
    RETURN QUERY SELECT 'invalid'::text, 'SESSION_NOT_FOUND'::text, NULL::uuid;
    RETURN;
  END IF;

  -- 3. Expiração absoluta
  IF v_session.expires_at < NOW() THEN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = NOW(), revoked_reason = 'expired'
    WHERE session_token = p_session_token;
    RETURN QUERY SELECT 'invalid'::text, 'SESSION_EXPIRED'::text, v_session.user_id;
    RETURN;
  END IF;

  -- 4. Inatividade 12h
  IF v_session.last_activity_at < NOW() - INTERVAL '12 hours' THEN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = NOW(), revoked_reason = 'inactivity_timeout'
    WHERE session_token = p_session_token;
    RETURN QUERY SELECT 'invalid'::text, 'INACTIVITY_TIMEOUT'::text, v_session.user_id;
    RETURN;
  END IF;

  -- 5. Epoch check
  IF v_session.auth_epoch_at_login IS NOT NULL AND v_session.auth_epoch_at_login < v_system.auth_epoch THEN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = NOW(), revoked_reason = 'epoch_revoked'
    WHERE session_token = p_session_token;
    RETURN QUERY SELECT 'invalid'::text, 'AUTH_EPOCH_REVOKED'::text, v_session.user_id;
    RETURN;
  END IF;

  -- 6. User exists (cast explícito uuid)
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = v_session.user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = NOW(), revoked_reason = 'user_deleted'
    WHERE session_token = p_session_token;
    RETURN QUERY SELECT 'invalid'::text, 'USER_DELETED'::text, v_session.user_id;
    RETURN;
  END IF;

  -- 7. Profile active
  SELECT (status IS NULL OR status != 'inativo') INTO v_profile_active
  FROM public.profiles
  WHERE id = v_session.user_id;

  IF v_profile_active IS NOT NULL AND NOT v_profile_active THEN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = NOW(), revoked_reason = 'user_disabled'
    WHERE session_token = p_session_token;
    RETURN QUERY SELECT 'invalid'::text, 'USER_DISABLED'::text, v_session.user_id;
    RETURN;
  END IF;

  -- 8. Atualizar activity
  UPDATE public.active_sessions
  SET last_activity_at = NOW()
  WHERE session_token = p_session_token;

  RETURN QUERY SELECT 'valid'::text, 'VALID'::text, v_session.user_id;
END;
$$;