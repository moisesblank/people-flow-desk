-- 🧠 COMPLEMENTO 2: AUTH_EPOCH CHECK COMPLETO (FIX)

-- 1. Dropar função antiga para poder alterar return type
DROP FUNCTION IF EXISTS public.validate_session_epoch(TEXT);

-- 2. Recriar com verificação completa de user
CREATE OR REPLACE FUNCTION public.validate_session_epoch(p_session_token TEXT)
RETURNS TABLE(is_valid BOOLEAN, reason TEXT, user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_current_epoch INTEGER;
  v_auth_enabled BOOLEAN;
  v_user_exists BOOLEAN;
  v_profile RECORD;
BEGIN
  -- 1. Verificar auth_enabled primeiro (LOCKDOWN CHECK)
  SELECT auth_enabled, auth_epoch INTO v_auth_enabled, v_current_epoch
  FROM public.system_guard LIMIT 1;
  
  IF NOT COALESCE(v_auth_enabled, true) THEN
    RETURN QUERY SELECT false, 'AUTH_LOCKDOWN'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- 2. Buscar sessão
  SELECT * INTO v_session
  FROM public.active_sessions
  WHERE session_token = p_session_token
    AND status = 'active';
  
  IF v_session IS NULL THEN
    RETURN QUERY SELECT false, 'SESSION_NOT_FOUND'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- 3. Verificar expiração
  IF v_session.expires_at < now() THEN
    UPDATE public.active_sessions
    SET status = 'expired', revoked_at = now(), revoked_reason = 'SESSION_EXPIRED'
    WHERE id = v_session.id;
    
    RETURN QUERY SELECT false, 'SESSION_EXPIRED'::TEXT, v_session.user_id;
    RETURN;
  END IF;
  
  -- 4. Verificar epoch (EPOCH CHECK - CRÍTICO)
  IF COALESCE(v_session.auth_epoch_at_login, 0) != COALESCE(v_current_epoch, 1) THEN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = now(), revoked_reason = 'AUTH_EPOCH_REVOKED'
    WHERE id = v_session.id;
    
    RETURN QUERY SELECT false, 'AUTH_EPOCH_REVOKED'::TEXT, v_session.user_id;
    RETURN;
  END IF;
  
  -- 5. Verificar se user existe (USER CHECK)
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = v_session.user_id
  ) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = now(), revoked_reason = 'USER_DELETED'
    WHERE id = v_session.id;
    
    RETURN QUERY SELECT false, 'USER_REVOKED'::TEXT, v_session.user_id;
    RETURN;
  END IF;
  
  -- 6. Verificar se user está ativo no profile (status check)
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_session.user_id;
  
  IF v_profile IS NOT NULL AND v_profile.status = 'inativo' THEN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = now(), revoked_reason = 'USER_DISABLED'
    WHERE id = v_session.id;
    
    RETURN QUERY SELECT false, 'USER_REVOKED'::TEXT, v_session.user_id;
    RETURN;
  END IF;
  
  -- ✅ Sessão válida
  RETURN QUERY SELECT true, 'VALID'::TEXT, v_session.user_id;
END;
$$;

-- 3. Função para verificar antes de criar sessão (pre-login check)
CREATE OR REPLACE FUNCTION public.check_auth_before_login()
RETURNS TABLE(allowed BOOLEAN, reason TEXT, current_epoch INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guard RECORD;
BEGIN
  SELECT auth_enabled, auth_epoch INTO v_guard
  FROM public.system_guard LIMIT 1;
  
  IF NOT COALESCE(v_guard.auth_enabled, true) THEN
    RETURN QUERY SELECT false, 'AUTH_LOCKDOWN'::TEXT, v_guard.auth_epoch;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'ALLOWED'::TEXT, COALESCE(v_guard.auth_epoch, 1);
END;
$$;

-- 4. Atualizar create_single_session para verificar lockdown antes
DROP FUNCTION IF EXISTS public.create_single_session(TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_single_session(
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _device_type TEXT DEFAULT NULL,
  _browser TEXT DEFAULT NULL,
  _os TEXT DEFAULT NULL
)
RETURNS TABLE (
  session_token TEXT,
  auth_epoch_at_login INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _new_token TEXT;
  _device_hash TEXT;
  _current_epoch INTEGER;
  _auth_enabled BOOLEAN;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- 🛑 VERIFICAR LOCKDOWN ANTES DE CRIAR SESSÃO
  SELECT auth_enabled, auth_epoch INTO _auth_enabled, _current_epoch
  FROM public.system_guard LIMIT 1;
  
  IF NOT COALESCE(_auth_enabled, true) THEN
    RAISE EXCEPTION 'AUTH_LOCKDOWN: Sistema em manutenção';
  END IF;
  
  _current_epoch := COALESCE(_current_epoch, 1);

  -- Gerar token único
  _new_token := gen_random_uuid()::TEXT;
  
  -- Gerar hash do dispositivo
  _device_hash := encode(
    sha256(
      (_user_agent || COALESCE(_ip_address, '') || _device_type || _browser || _os)::bytea
    ),
    'hex'
  );

  -- Revogar sessões anteriores do usuário
  UPDATE public.active_sessions
  SET 
    status = 'revoked',
    revoked_at = now(),
    revoked_reason = 'new_session_started'
  WHERE user_id = _user_id AND status = 'active';

  -- Criar nova sessão COM EPOCH
  INSERT INTO public.active_sessions (
    user_id,
    session_token,
    device_hash,
    device_type,
    device_name,
    user_agent,
    status,
    expires_at,
    auth_epoch_at_login
  ) VALUES (
    _user_id,
    _new_token,
    _device_hash,
    _device_type,
    COALESCE(_browser, 'Unknown') || ' on ' || COALESCE(_os, 'Unknown'),
    _user_agent,
    'active',
    now() + INTERVAL '7 days',
    _current_epoch
  );

  RETURN QUERY SELECT _new_token, _current_epoch;
END;
$$;

-- 5. Grant para funções
GRANT EXECUTE ON FUNCTION public.check_auth_before_login() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_session_epoch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_single_session(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;