-- ============================================
-- EXPIRAÇÃO DE SESSÃO POR TIPO DE USUÁRIO
-- Funcionários: PERMANENTE (365 dias)
-- Alunos: Respeita access_expires_at ou 30 dias
-- ============================================

-- Drop e recria a função com a lógica de expiração diferenciada
DROP FUNCTION IF EXISTS public.create_single_session(text,text,text,text,text,text);

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
AS $$
DECLARE
  _user_id UUID;
  _user_email TEXT;
  _new_token UUID;
  _device_hash TEXT;
  _current_epoch INTEGER;
  _auth_enabled BOOLEAN;
  _sessions_revoked INTEGER;
  _revoked_session_ids UUID[];
  _is_funcionario BOOLEAN;
  _access_expires_at TIMESTAMPTZ;
  _session_expires_at TIMESTAMPTZ;
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

  -- ✨ VERIFICAR TIPO DE USUÁRIO (Funcionário vs Aluno)
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = _user_id 
    AND role IN ('owner', 'admin', 'coordenacao', 'contabilidade', 'suporte', 'monitoria', 'marketing', 'afiliado')
  ) INTO _is_funcionario;
  
  -- Buscar access_expires_at do perfil
  SELECT access_expires_at INTO _access_expires_at
  FROM profiles
  WHERE id = _user_id;
  
  -- ✨ DEFINIR EXPIRAÇÃO DA SESSÃO BASEADO NO TIPO
  IF _is_funcionario THEN
    -- FUNCIONÁRIOS: 365 dias (praticamente PERMANENTE)
    _session_expires_at := NOW() + INTERVAL '365 days';
  ELSIF _access_expires_at IS NOT NULL THEN
    -- ALUNO COM EXPIRAÇÃO DEFINIDA: respeita o access_expires_at
    -- Sessão expira no menor entre access_expires_at e 30 dias
    _session_expires_at := LEAST(_access_expires_at, NOW() + INTERVAL '30 days');
  ELSE
    -- ALUNO VITALÍCIO (access_expires_at = null): 30 dias
    _session_expires_at := NOW() + INTERVAL '30 days';
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

  -- Criar nova sessão com expiração diferenciada
  INSERT INTO public.active_sessions (
    user_id, session_token, device_hash, device_type, device_name, user_agent, status, expires_at, auth_epoch_at_login
  ) VALUES (
    _user_id, _new_token, _device_hash, _device_type,
    COALESCE(_browser, 'Unknown') || ' on ' || COALESCE(_os, 'Unknown'),
    _user_agent, 'active', _session_expires_at, _current_epoch
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
      'epoch', _current_epoch,
      'is_funcionario', _is_funcionario,
      'session_expires_at', _session_expires_at
    )
  );

  RETURN QUERY SELECT _new_token, _current_epoch;
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.create_single_session IS 
'Cria sessão única com expiração diferenciada: Funcionários=365d (PERMANENTE), Alunos=30d ou access_expires_at. v3.0 - 2025-01-05';