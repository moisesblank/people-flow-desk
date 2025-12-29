-- ============================================
-- 🔐 BLOCO 6: LOGS COMPLETOS DE SEGURANÇA
-- Adiciona logs obrigatórios para escala de 5000 usuários
-- ============================================

-- 1. Adicionar índices otimizados para consultas de auditoria em escala
CREATE INDEX IF NOT EXISTS idx_security_events_user_timestamp 
ON public.security_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_type_timestamp 
ON public.security_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp 
ON public.audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_timestamp 
ON public.audit_logs(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_active_sessions_device_hash 
ON public.active_sessions(device_hash);

CREATE INDEX IF NOT EXISTS idx_active_sessions_status_user 
ON public.active_sessions(status, user_id);

-- 2. Recriar create_single_session com LOG_DE_LOGIN_COM_DEVICE_HASH
DROP FUNCTION IF EXISTS public.create_single_session(TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.create_single_session(
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _device_type TEXT DEFAULT 'desktop',
  _browser TEXT DEFAULT NULL,
  _os TEXT DEFAULT NULL,
  _device_hash_from_server TEXT DEFAULT NULL -- Novo: hash do servidor
)
RETURNS TABLE(session_token UUID, auth_epoch_at_login INTEGER)
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
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Buscar email do usuário
  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;

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

  -- DOGMA I: Revogar sessões anteriores
  UPDATE public.active_sessions
  SET status = 'revoked', revoked_at = now(), revoked_reason = 'new_session_started'
  WHERE user_id = _user_id AND status = 'active';
  
  GET DIAGNOSTICS _sessions_revoked = ROW_COUNT;

  -- Criar nova sessão
  INSERT INTO public.active_sessions (
    user_id, session_token, device_hash, device_type, device_name, user_agent, status, expires_at, auth_epoch_at_login
  ) VALUES (
    _user_id, _new_token, _device_hash, _device_type,
    COALESCE(_browser, 'Unknown') || ' on ' || COALESCE(_os, 'Unknown'),
    _user_agent, 'active', now() + INTERVAL '7 days', _current_epoch
  );

  -- 🔐 BLOCO 6: LOG_DE_LOGIN_COM_DEVICE_HASH (OBRIGATÓRIO)
  INSERT INTO audit_logs (action, user_id, table_name, new_data)
  VALUES ('LOGIN_WITH_DEVICE_HASH', _user_id, 'active_sessions', 
    jsonb_build_object(
      'device_hash_prefix', substring(_device_hash from 1 for 16),
      'device_type', _device_type, 
      'browser', _browser, 
      'os', _os,
      'sessions_revoked', _sessions_revoked,
      'epoch', _current_epoch
    )
  );

  -- Também registrar em security_events para monitoramento
  INSERT INTO security_events (user_id, event_type, severity, description, metadata)
  VALUES (
    _user_id, 
    'LOGIN_SUCCESS', 
    'info',
    'Login realizado com sucesso',
    jsonb_build_object(
      'device_hash_prefix', substring(_device_hash from 1 for 16),
      'device_type', _device_type,
      'browser', _browser,
      'os', _os,
      'sessions_revoked', _sessions_revoked
    )
  );

  RETURN QUERY SELECT _new_token, _current_epoch;
END;
$$;

-- 3. Criar trigger para LOG_DE_INVALIDACAO_DE_TOKEN automático
CREATE OR REPLACE FUNCTION public.log_session_invalidation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Só logar quando status muda de 'active' para outro
  IF OLD.status = 'active' AND NEW.status != 'active' THEN
    -- 🔐 BLOCO 6: LOG_DE_INVALIDACAO_DE_TOKEN (OBRIGATÓRIO)
    INSERT INTO security_events (user_id, event_type, severity, description, metadata)
    VALUES (
      NEW.user_id,
      'SESSION_INVALIDATED',
      CASE 
        WHEN NEW.revoked_reason IN ('user_banned', 'USER_DELETED', 'epoch_expired', 'AUTH_EPOCH_REVOKED') THEN 'warning'
        ELSE 'info'
      END,
      'Sessão invalidada: ' || COALESCE(NEW.revoked_reason, 'unknown'),
      jsonb_build_object(
        'session_id', NEW.id,
        'device_hash_prefix', substring(NEW.device_hash from 1 for 16),
        'revoked_reason', NEW.revoked_reason,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'device_type', NEW.device_type,
        'device_name', NEW.device_name
      )
    );
    
    -- Também em audit_logs para rastreabilidade
    INSERT INTO audit_logs (action, user_id, table_name, record_id, new_data, old_data)
    VALUES (
      'TOKEN_INVALIDATED',
      NEW.user_id,
      'active_sessions',
      NEW.id::text,
      jsonb_build_object(
        'status', NEW.status, 
        'revoked_reason', NEW.revoked_reason,
        'revoked_at', NEW.revoked_at,
        'device_hash_prefix', substring(NEW.device_hash from 1 for 16)
      ),
      jsonb_build_object('status', OLD.status)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela active_sessions
DROP TRIGGER IF EXISTS trg_log_session_invalidation ON public.active_sessions;
CREATE TRIGGER trg_log_session_invalidation
AFTER UPDATE ON public.active_sessions
FOR EACH ROW
EXECUTE FUNCTION public.log_session_invalidation();

-- 4. Particionamento automático para suportar 5000 usuários (cleanup)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Manter apenas 90 dias de security_events
  DELETE FROM security_events WHERE created_at < now() - INTERVAL '90 days';
  
  -- Manter apenas 180 dias de audit_logs
  DELETE FROM audit_logs WHERE created_at < now() - INTERVAL '180 days';
  
  -- Manter apenas 30 dias de sessões expiradas/revogadas
  DELETE FROM active_sessions 
  WHERE status != 'active' AND created_at < now() - INTERVAL '30 days';
END;
$$;

-- 5. Grant execute para funções
GRANT EXECUTE ON FUNCTION public.create_single_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_security_logs TO service_role;