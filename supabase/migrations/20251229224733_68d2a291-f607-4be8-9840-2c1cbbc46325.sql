
-- ============================================
-- 🛡️ MODELO HÍBRIDO DE SESSÕES v1.0
-- Staff/Owner: Sessão única (2º login derruba 1º instantâneo)
-- Alunos: Até 3 dispositivos simultâneos, Device Gate no 4º
-- ============================================

-- Dropar função existente para recriar
DROP FUNCTION IF EXISTS public.create_single_session(text,text,text,text,text,text);

-- Função principal com modelo híbrido
CREATE OR REPLACE FUNCTION public.create_single_session(
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
  _is_staff BOOLEAN;
  _is_aluno BOOLEAN;
  _is_owner BOOLEAN;
  _active_session_count INTEGER;
  _max_allowed_sessions INTEGER;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Buscar email e detectar tipo de usuário
  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;
  
  -- Detectar se é owner, staff ou aluno
  _is_owner := is_owner(_user_id);
  _is_staff := is_gestao_staff(_user_id);
  _is_aluno := is_aluno(_user_id);
  
  -- Definir limite baseado no tipo de usuário
  -- Owner: ilimitado (tratamos como 999)
  -- Staff: 1 sessão (single session)
  -- Aluno: 3 sessões simultâneas
  IF _is_owner THEN
    _max_allowed_sessions := 999;
  ELSIF _is_staff THEN
    _max_allowed_sessions := 1;
  ELSIF _is_aluno THEN
    _max_allowed_sessions := 3;
  ELSE
    -- Usuário sem role definida: padrão conservador
    _max_allowed_sessions := 1;
  END IF;

  -- Verificar lockdown global
  SELECT sg.auth_enabled, sg.auth_epoch INTO _auth_enabled, _current_epoch
  FROM public.system_guard sg LIMIT 1;
  
  IF NOT COALESCE(_auth_enabled, true) THEN
    RAISE EXCEPTION 'AUTH_LOCKDOWN: Sistema em manutenção';
  END IF;
  
  _current_epoch := COALESCE(_current_epoch, 1);
  _new_token := gen_random_uuid();
  
  -- Calcular device_hash
  IF _device_hash_from_server IS NOT NULL THEN
    _device_hash := _device_hash_from_server;
  ELSE
    _device_hash := encode(
      sha256((COALESCE(_user_agent, '') || COALESCE(_ip_address, '') || COALESCE(_device_type, '') || COALESCE(_browser, '') || COALESCE(_os, ''))::bytea),
      'hex'
    );
  END IF;

  -- 🔒 LOCK ADVISORY POR USUÁRIO (evita race condition)
  PERFORM pg_advisory_xact_lock(hashtext('session_lock_' || _user_id::text));

  -- Contar sessões ativas atuais
  SELECT COUNT(*) INTO _active_session_count
  FROM public.active_sessions
  WHERE user_id = _user_id AND status = 'active';

  -- ============================================
  -- 🛡️ MODELO HÍBRIDO - DECISÃO
  -- ============================================
  
  IF _max_allowed_sessions = 1 THEN
    -- STAFF: Sessão única - revogar todas as anteriores
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = now(), revoked_reason = 'new_session_started'
    WHERE user_id = _user_id AND status = 'active';
    
    GET DIAGNOSTICS _sessions_revoked = ROW_COUNT;
    
  ELSIF _max_allowed_sessions > 1 AND _active_session_count >= _max_allowed_sessions THEN
    -- ALUNO: Limite atingido - NÃO criar sessão, retornar erro
    -- O frontend deve redirecionar para /security/device-limit
    RAISE EXCEPTION 'DEVICE_LIMIT_EXCEEDED:max=%,current=%', _max_allowed_sessions, _active_session_count;
    
  ELSE
    -- Owner ou Aluno com espaço: não revogar ninguém
    _sessions_revoked := 0;
  END IF;

  -- Criar nova sessão
  INSERT INTO public.active_sessions (
    user_id, session_token, device_hash, device_type, device_name, user_agent, status, expires_at, auth_epoch_at_login
  ) VALUES (
    _user_id, _new_token, _device_hash, _device_type,
    COALESCE(_browser, 'Unknown') || ' on ' || COALESCE(_os, 'Unknown'),
    _user_agent, 'active', now() + INTERVAL '7 days', _current_epoch
  );

  -- 🔐 LOG DE LOGIN
  INSERT INTO audit_logs (action, user_id, table_name, new_data)
  VALUES ('LOGIN_HYBRID_MODEL', _user_id, 'active_sessions', 
    jsonb_build_object(
      'device_hash_prefix', substring(_device_hash from 1 for 16),
      'device_type', _device_type, 
      'browser', _browser, 
      'os', _os,
      'sessions_revoked', _sessions_revoked,
      'epoch', _current_epoch,
      'is_owner', _is_owner,
      'is_staff', _is_staff,
      'is_aluno', _is_aluno,
      'max_allowed', _max_allowed_sessions,
      'active_before', _active_session_count,
      'model', CASE 
        WHEN _is_owner THEN 'OWNER_UNLIMITED'
        WHEN _is_staff THEN 'STAFF_SINGLE_SESSION'
        ELSE 'STUDENT_3_DEVICES'
      END
    )
  );

  -- 🛡️ Registrar em security_events
  INSERT INTO security_events (user_id, event_type, severity, source, description, payload)
  VALUES (
    _user_id, 
    'LOGIN_SUCCESS', 
    'info',
    'create_single_session_hybrid',
    CASE 
      WHEN _is_staff AND _sessions_revoked > 0 THEN 'Staff login: ' || _sessions_revoked || ' sessões revogadas'
      WHEN _is_aluno THEN 'Aluno login: sessão ' || (_active_session_count + 1) || '/' || _max_allowed_sessions
      ELSE 'Owner login: ilimitado'
    END,
    jsonb_build_object(
      'device_type', _device_type,
      'browser', _browser,
      'os', _os,
      'model', CASE 
        WHEN _is_owner THEN 'OWNER_UNLIMITED'
        WHEN _is_staff THEN 'STAFF_SINGLE_SESSION'
        ELSE 'STUDENT_3_DEVICES'
      END
    )
  );

  RETURN QUERY SELECT _new_token, _current_epoch;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.create_single_session(text,text,text,text,text,text) TO authenticated;

-- ============================================
-- FUNÇÃO AUXILIAR: Listar sessões ativas do usuário (para Device Gate)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_active_sessions()
RETURNS TABLE(
  id UUID,
  device_type TEXT,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  created_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.device_type,
    s.device_name,
    CASE 
      WHEN s.user_agent LIKE '%Firefox%' THEN 'Firefox'
      WHEN s.user_agent LIKE '%Edg%' THEN 'Edge'
      WHEN s.user_agent LIKE '%Chrome%' THEN 'Chrome'
      WHEN s.user_agent LIKE '%Safari%' THEN 'Safari'
      ELSE 'Outro'
    END AS browser,
    CASE 
      WHEN s.user_agent LIKE '%Windows%' THEN 'Windows'
      WHEN s.user_agent LIKE '%Mac%' THEN 'macOS'
      WHEN s.user_agent LIKE '%Linux%' THEN 'Linux'
      WHEN s.user_agent LIKE '%Android%' THEN 'Android'
      WHEN s.user_agent LIKE '%iPhone%' OR s.user_agent LIKE '%iOS%' THEN 'iOS'
      ELSE 'Outro'
    END AS os,
    s.created_at,
    s.last_activity_at
  FROM public.active_sessions s
  WHERE s.user_id = auth.uid()
    AND s.status = 'active'
  ORDER BY s.last_activity_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_active_sessions() TO authenticated;

-- ============================================
-- FUNÇÃO: Revogar sessão específica (para Device Gate)
-- ============================================
CREATE OR REPLACE FUNCTION public.revoke_specific_session(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _affected INTEGER;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  -- Revogar sessão específica do próprio usuário
  UPDATE public.active_sessions
  SET status = 'revoked', revoked_at = now(), revoked_reason = 'user_revoked_from_gate'
  WHERE id = p_session_id 
    AND user_id = _user_id 
    AND status = 'active';
  
  GET DIAGNOSTICS _affected = ROW_COUNT;
  
  IF _affected = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'SESSION_NOT_FOUND');
  END IF;

  -- Log
  INSERT INTO audit_logs (action, user_id, table_name, record_id, new_data)
  VALUES ('SESSION_REVOKED_BY_USER', _user_id, 'active_sessions', p_session_id::text,
    jsonb_build_object('reason', 'user_revoked_from_gate'));

  RETURN jsonb_build_object('success', true, 'revoked_session_id', p_session_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_specific_session(UUID) TO authenticated;
