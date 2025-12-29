
-- ============================================
-- FIX DOGMA I: DROP ALL e recria funções de sessão
-- ============================================

-- Drop TODAS as funções relacionadas
DROP FUNCTION IF EXISTS public.create_single_session(TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.validate_session_token(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.validate_session_token(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_active_session_exists(TEXT) CASCADE;

-- ============================================
-- 1. create_single_session
-- ============================================
CREATE FUNCTION public.create_single_session(
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _device_type TEXT DEFAULT 'desktop',
  _browser TEXT DEFAULT NULL,
  _os TEXT DEFAULT NULL
)
RETURNS TABLE(session_token UUID, auth_epoch_at_login INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id UUID;
  _new_token UUID;
  _device_hash TEXT;
  _current_epoch INTEGER;
  _auth_enabled BOOLEAN;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT sg.auth_enabled, sg.auth_epoch INTO _auth_enabled, _current_epoch
  FROM public.system_guard sg LIMIT 1;
  
  IF NOT COALESCE(_auth_enabled, true) THEN
    RAISE EXCEPTION 'AUTH_LOCKDOWN: Sistema em manutenção';
  END IF;
  
  _current_epoch := COALESCE(_current_epoch, 1);
  _new_token := gen_random_uuid();
  
  _device_hash := encode(
    sha256((COALESCE(_user_agent, '') || COALESCE(_ip_address, '') || COALESCE(_device_type, '') || COALESCE(_browser, '') || COALESCE(_os, ''))::bytea),
    'hex'
  );

  -- DOGMA I: Revogar sessões anteriores
  UPDATE public.active_sessions
  SET status = 'revoked', revoked_at = now(), revoked_reason = 'new_session_started'
  WHERE user_id = _user_id AND status = 'active';

  -- Criar nova sessão
  INSERT INTO public.active_sessions (
    user_id, session_token, device_hash, device_type, device_name, user_agent, status, expires_at, auth_epoch_at_login
  ) VALUES (
    _user_id, _new_token, _device_hash, _device_type,
    COALESCE(_browser, 'Unknown') || ' on ' || COALESCE(_os, 'Unknown'),
    _user_agent, 'active', now() + INTERVAL '7 days', _current_epoch
  );

  INSERT INTO audit_logs (action, user_id, table_name, new_data)
  VALUES ('SESSION_CREATED', _user_id, 'active_sessions', 
    jsonb_build_object('device_type', _device_type, 'browser', _browser, 'os', _os));

  RETURN QUERY SELECT _new_token, _current_epoch;
END;
$$;

-- ============================================
-- 2. validate_session_token
-- ============================================
CREATE FUNCTION public.validate_session_token(p_session_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _session_record RECORD;
  _current_epoch INTEGER;
BEGIN
  SELECT * INTO _session_record
  FROM public.active_sessions
  WHERE session_token = p_session_token AND status = 'active' AND expires_at > now();
  
  IF NOT FOUND THEN RETURN FALSE; END IF;
  
  SELECT auth_epoch INTO _current_epoch FROM public.system_guard LIMIT 1;
  IF _session_record.auth_epoch_at_login < COALESCE(_current_epoch, 1) THEN
    UPDATE public.active_sessions SET status = 'revoked', revoked_at = now(), revoked_reason = 'epoch_expired' WHERE id = _session_record.id;
    RETURN FALSE;
  END IF;
  
  UPDATE public.active_sessions SET last_activity_at = now() WHERE id = _session_record.id;
  RETURN TRUE;
END;
$$;

-- ============================================
-- 3. check_active_session_exists
-- ============================================
CREATE FUNCTION public.check_active_session_exists(_email TEXT)
RETURNS TABLE(has_active_session BOOLEAN, device_name TEXT, device_type TEXT, last_activity_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id UUID;
BEGIN
  SELECT au.id INTO _user_id FROM auth.users au WHERE LOWER(au.email) = LOWER(_email);
  
  IF _user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT TRUE, s.device_name, s.device_type, s.last_activity_at
  FROM public.active_sessions s
  WHERE s.user_id = _user_id AND s.status = 'active' AND s.expires_at > now()
  ORDER BY s.created_at DESC LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ;
  END IF;
END;
$$;
