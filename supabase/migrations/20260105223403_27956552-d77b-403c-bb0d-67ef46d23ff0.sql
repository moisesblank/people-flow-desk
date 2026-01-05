-- 🔧 P0 FIX: Corrigir erro "uuid = text" na validate_session_epoch
-- O session_token é UUID no banco, mas o parâmetro é TEXT
-- Solução: cast explícito do parâmetro para UUID

DROP FUNCTION IF EXISTS public.validate_session_epoch(text);

CREATE OR REPLACE FUNCTION public.validate_session_epoch(p_session_token TEXT)
RETURNS TABLE(status TEXT, reason TEXT, user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_system RECORD;
  v_user_exists boolean;
  v_profile_active boolean;
  v_session_token_uuid UUID;
BEGIN
  -- 🔧 FIX: Cast explícito de TEXT para UUID
  BEGIN
    v_session_token_uuid := p_session_token::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'invalid'::TEXT, 'INVALID_TOKEN_FORMAT'::TEXT, NULL::UUID;
    RETURN;
  END;

  -- 1. Verificar system_guard
  SELECT sg.auth_enabled, sg.auth_epoch INTO v_system
  FROM public.system_guard sg
  LIMIT 1;

  IF v_system IS NULL OR NOT v_system.auth_enabled THEN
    RETURN QUERY SELECT 'invalid'::TEXT, 'AUTH_LOCKDOWN'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- 2. Buscar sessão (usando UUID castado)
  SELECT s.user_id, s.auth_epoch_at_login, s.status, s.last_activity_at, s.expires_at
  INTO v_session
  FROM public.active_sessions s
  WHERE s.session_token = v_session_token_uuid
    AND s.status = 'active';

  IF v_session IS NULL THEN
    RETURN QUERY SELECT 'invalid'::TEXT, 'SESSION_NOT_FOUND'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- 3. Expiração absoluta
  IF v_session.expires_at < NOW() THEN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = NOW(), revoked_reason = 'expired'
    WHERE session_token = v_session_token_uuid;
    RETURN QUERY SELECT 'invalid'::TEXT, 'SESSION_EXPIRED'::TEXT, v_session.user_id;
    RETURN;
  END IF;

  -- 4. Inatividade 12h
  IF v_session.last_activity_at < NOW() - INTERVAL '12 hours' THEN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = NOW(), revoked_reason = 'inactivity_timeout'
    WHERE session_token = v_session_token_uuid;
    RETURN QUERY SELECT 'invalid'::TEXT, 'INACTIVITY_TIMEOUT'::TEXT, v_session.user_id;
    RETURN;
  END IF;

  -- 5. Epoch check
  IF v_session.auth_epoch_at_login IS NOT NULL AND v_session.auth_epoch_at_login < v_system.auth_epoch THEN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = NOW(), revoked_reason = 'epoch_revoked'
    WHERE session_token = v_session_token_uuid;
    RETURN QUERY SELECT 'invalid'::TEXT, 'AUTH_EPOCH_REVOKED'::TEXT, v_session.user_id;
    RETURN;
  END IF;

  -- 6. User exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = v_session.user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = NOW(), revoked_reason = 'user_deleted'
    WHERE session_token = v_session_token_uuid;
    RETURN QUERY SELECT 'invalid'::TEXT, 'USER_DELETED'::TEXT, v_session.user_id;
    RETURN;
  END IF;

  -- 7. Profile active
  SELECT (p.status IS NULL OR p.status != 'inativo') INTO v_profile_active
  FROM public.profiles p
  WHERE p.id = v_session.user_id;

  IF v_profile_active IS NOT NULL AND NOT v_profile_active THEN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = NOW(), revoked_reason = 'user_disabled'
    WHERE session_token = v_session_token_uuid;
    RETURN QUERY SELECT 'invalid'::TEXT, 'USER_DISABLED'::TEXT, v_session.user_id;
    RETURN;
  END IF;

  -- 8. Atualizar activity
  UPDATE public.active_sessions
  SET last_activity_at = NOW()
  WHERE session_token = v_session_token_uuid;

  RETURN QUERY SELECT 'valid'::TEXT, 'VALID'::TEXT, v_session.user_id;
END;
$$;

-- Grant para RLS funcionar
GRANT EXECUTE ON FUNCTION public.validate_session_epoch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_session_epoch(TEXT) TO anon;