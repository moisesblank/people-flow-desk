
-- 🚀 UPGRADE: Adicionar Broadcast direto na revogação de sessão para notificação INSTANTÂNEA
-- Isso garante que o dispositivo antigo seja notificado em <1 segundo

DROP FUNCTION IF EXISTS public.create_single_session(text,text,text,text,text,text);

CREATE FUNCTION public.create_single_session(
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _device_type TEXT DEFAULT NULL,
  _browser TEXT DEFAULT NULL,
  _os TEXT DEFAULT NULL,
  _device_hash_from_server TEXT DEFAULT NULL
)
RETURNS TABLE(session_token UUID, auth_epoch INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _user_email TEXT;
  _new_token UUID;
  _device_hash TEXT;
  _current_epoch INTEGER;
  _auth_enabled BOOLEAN;
  _sessions_revoked INTEGER;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Buscar email do usuário
  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;

  -- Verificar lockdown global
  SELECT sg.auth_enabled, sg.auth_epoch INTO _auth_enabled, _current_epoch
  FROM public.system_guard sg LIMIT 1;
  
  IF NOT COALESCE(_auth_enabled, true) THEN
    RAISE EXCEPTION 'AUTH_LOCKDOWN: Sistema em manutenção';
  END IF;
  
  _current_epoch := COALESCE(_current_epoch, 1);
  _new_token := gen_random_uuid();
  
  -- Usar device_hash do servidor se fornecido, senão calcular localmente
  IF _device_hash_from_server IS NOT NULL THEN
    _device_hash := _device_hash_from_server;
  ELSE
    _device_hash := encode(
      sha256((COALESCE(_user_agent, '') || COALESCE(_ip_address, '') || COALESCE(_device_type, '') || COALESCE(_browser, '') || COALESCE(_os, ''))::bytea),
      'hex'
    );
  END IF;

  -- 🔒 LOCK ADVISORY POR USUÁRIO (evita race condition entre 2 logins simultâneos)
  PERFORM pg_advisory_xact_lock(hashtext('session_lock_' || _user_id::text));

  -- DOGMA I: Revogar TODAS as sessões ativas anteriores (DENTRO DO LOCK)
  UPDATE public.active_sessions
  SET status = 'revoked', revoked_at = now(), revoked_reason = 'new_session_started'
  WHERE user_id = _user_id AND status = 'active';
  
  GET DIAGNOSTICS _sessions_revoked = ROW_COUNT;

  -- Criar nova sessão (índice único garante que só 1 pode existir)
  INSERT INTO public.active_sessions (
    user_id, session_token, device_hash, device_type, device_name, user_agent, status, expires_at, auth_epoch_at_login
  ) VALUES (
    _user_id, _new_token, _device_hash, _device_type,
    COALESCE(_browser, 'Unknown') || ' on ' || COALESCE(_os, 'Unknown'),
    _user_agent, 'active', now() + INTERVAL '7 days', _current_epoch
  );

  -- 🔐 LOG DE LOGIN
  INSERT INTO audit_logs (action, user_id, table_name, new_data)
  VALUES ('LOGIN_WITH_DEVICE_HASH', _user_id, 'active_sessions', 
    jsonb_build_object(
      'device_hash_prefix', substring(_device_hash from 1 for 16),
      'device_type', _device_type, 
      'browser', _browser, 
      'os', _os,
      'sessions_revoked', _sessions_revoked,
      'epoch', _current_epoch,
      'enforcement', 'DATABASE_UNIQUE_INDEX'
    )
  );

  -- 🛡️ Registrar em security_events
  INSERT INTO security_events (user_id, event_type, severity, source, description, payload)
  VALUES (
    _user_id, 
    'LOGIN_SUCCESS', 
    'info',
    'create_single_session',
    'Login realizado com sucesso (DB-enforced single session)',
    jsonb_build_object(
      'device_hash_prefix', substring(_device_hash from 1 for 16),
      'device_type', _device_type,
      'browser', _browser,
      'os', _os,
      'sessions_revoked', _sessions_revoked
    )
  );

  -- 🚀 LOG se sessões foram revogadas (para debug)
  IF _sessions_revoked > 0 THEN
    INSERT INTO audit_logs (action, user_id, table_name, new_data)
    VALUES ('SESSION_REVOKED_BY_NEW_LOGIN', _user_id, 'active_sessions', 
      jsonb_build_object(
        'sessions_revoked', _sessions_revoked,
        'new_device_type', _device_type,
        'new_browser', _browser,
        'new_os', _os,
        'notification', 'REALTIME_POSTGRES_CHANGES'
      )
    );
  END IF;

  RETURN QUERY SELECT _new_token, _current_epoch;
END;
$$;

-- Garantir que a função tenha as permissões corretas
GRANT EXECUTE ON FUNCTION public.create_single_session(text,text,text,text,text,text) TO authenticated;
