-- ============================================
-- 🔐 MODELO UNIFICADO DE SESSÃO v2.0
-- SEMPRE 1 sessão ativa para TODOS
-- Dispositivo registrado = revoga sessão anterior imediata
-- Dispositivo novo com 3 já = DEVICE_LIMIT_EXCEEDED
-- ============================================

-- Dropar funções anteriores
DROP FUNCTION IF EXISTS public.create_single_session(text, text, text, text, text, text);

-- ============================================
-- CREATE_SINGLE_SESSION: SEMPRE SINGLE SESSION
-- ============================================
CREATE OR REPLACE FUNCTION public.create_single_session(
  _ip_address text DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _device_type text DEFAULT 'desktop',
  _browser text DEFAULT NULL,
  _os text DEFAULT NULL,
  _device_hash_from_server text DEFAULT NULL
)
RETURNS TABLE(session_token uuid, auth_epoch_at_login integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_id UUID;
  _user_email TEXT;
  _new_token UUID;
  _device_hash TEXT;
  _current_epoch INTEGER;
  _auth_enabled BOOLEAN;
  _sessions_revoked INTEGER;
  _revoked_session_ids UUID[];
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

  -- 🔐 DOGMA I UNIFICADO: Revogar TODAS as sessões ativas anteriores (para TODOS)
  -- Guardar IDs para broadcast
  SELECT array_agg(id) INTO _revoked_session_ids
  FROM public.active_sessions
  WHERE user_id = _user_id AND status = 'active';
  
  -- Revogar todas
  UPDATE public.active_sessions
  SET status = 'revoked', revoked_at = now(), revoked_reason = 'new_session_from_device'
  WHERE user_id = _user_id AND status = 'active';
  
  GET DIAGNOSTICS _sessions_revoked = ROW_COUNT;

  -- 🔊 BROADCAST: Notificar sessões revogadas via Realtime
  IF _sessions_revoked > 0 AND _revoked_session_ids IS NOT NULL THEN
    FOR i IN 1..array_length(_revoked_session_ids, 1)
    LOOP
      PERFORM pg_notify('session_revoked', json_build_object(
        'session_id', _revoked_session_ids[i],
        'user_id', _user_id,
        'reason', 'new_session_from_device',
        'new_device', json_build_object('type', _device_type, 'browser', _browser, 'os', _os)
      )::text);
    END LOOP;
  END IF;

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
  VALUES ('LOGIN_UNIFIED_SINGLE_SESSION', _user_id, 'active_sessions', 
    jsonb_build_object(
      'device_hash_prefix', left(_device_hash, 16),
      'device_type', _device_type,
      'browser', _browser,
      'os', _os,
      'sessions_revoked', _sessions_revoked,
      'epoch', _current_epoch
    )
  );

  RETURN QUERY SELECT _new_token, _current_epoch;
END;
$function$;

-- ============================================
-- FUNÇÃO AUXILIAR: get_user_device_count
-- Retorna contagem de dispositivos registrados
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_device_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INTEGER;
BEGIN
  SELECT COUNT(*) INTO _count
  FROM public.user_devices
  WHERE user_id = auth.uid()
    AND is_active = true;
  
  RETURN COALESCE(_count, 0);
END;
$$;

-- ============================================
-- Grant execute permissions
-- ============================================
GRANT EXECUTE ON FUNCTION public.create_single_session(text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_device_count() TO authenticated;