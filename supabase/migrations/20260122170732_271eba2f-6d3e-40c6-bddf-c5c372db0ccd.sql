-- ============================================
-- 🛡️ P0 FIX: OWNER MULTI-SESSION v1.0
-- Permite APENAS o Owner ter múltiplas sessões simultâneas
-- Todos os outros usuários continuam com sessão única
-- ============================================

-- Drop da função existente com assinatura correta
DROP FUNCTION IF EXISTS public.create_single_session(text, text, text, text, text, text);

-- Recriar com lógica de bypass para Owner
CREATE OR REPLACE FUNCTION public.create_single_session(
  _ip_address text DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _device_type text DEFAULT NULL,
  _browser text DEFAULT NULL,
  _os text DEFAULT NULL,
  _device_hash_from_server text DEFAULT NULL
)
RETURNS TABLE(session_token uuid, auth_epoch_at_login integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _new_session_token uuid;
  _current_epoch integer;
  _is_owner boolean := false;
  _revoked_count integer := 0;
BEGIN
  -- Obter user_id do contexto de autenticação
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- 🔐 P0 FIX: Verificar se é OWNER
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'owner'
  ) INTO _is_owner;

  -- Lock para evitar race conditions
  PERFORM pg_advisory_xact_lock(hashtext('session_' || _user_id::text));

  -- 🔐 P0 FIX: OWNER NÃO TEM SESSÕES REVOGADAS
  -- Apenas outros usuários têm suas sessões anteriores deletadas
  IF NOT _is_owner THEN
    -- Deletar sessões anteriores (física, não lógica)
    DELETE FROM public.active_sessions 
    WHERE user_id = _user_id 
    AND status = 'active';
    
    GET DIAGNOSTICS _revoked_count = ROW_COUNT;
    
    -- Log se houve revogação
    IF _revoked_count > 0 THEN
      -- Notificar via pg_notify para broadcast realtime
      PERFORM pg_notify(
        'session_revoked',
        json_build_object(
          'user_id', _user_id,
          'reason', 'new_login',
          'revoked_at', NOW()
        )::text
      );
    END IF;
  END IF;

  -- Obter epoch atual do system_guard
  SELECT auth_epoch INTO _current_epoch 
  FROM public.system_guard 
  LIMIT 1;
  
  IF _current_epoch IS NULL THEN
    _current_epoch := 1;
  END IF;

  -- Gerar novo token de sessão
  _new_session_token := gen_random_uuid();

  -- Criar nova sessão
  INSERT INTO public.active_sessions (
    user_id,
    session_token,
    device_hash,
    device_type,
    device_name,
    user_agent,
    ip_address,
    status,
    auth_epoch_at_login,
    mfa_verified,
    expires_at,
    last_activity_at
  ) VALUES (
    _user_id,
    _new_session_token,
    COALESCE(_device_hash_from_server, 'unknown'),
    COALESCE(_device_type, 'desktop'),
    COALESCE(_browser, 'unknown') || ' / ' || COALESCE(_os, 'unknown'),
    LEFT(_user_agent, 255),
    _ip_address::inet,
    'active',
    _current_epoch,
    false,
    CASE 
      WHEN _is_owner THEN NOW() + INTERVAL '365 days'
      WHEN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = _user_id 
        AND role IN ('admin', 'coordenacao', 'contabilidade', 'suporte', 'monitoria', 'marketing', 'afiliado')
      ) THEN NOW() + INTERVAL '365 days'
      ELSE NOW() + INTERVAL '30 days'
    END,
    NOW()
  );

  -- Retornar token e epoch
  RETURN QUERY SELECT _new_session_token, _current_epoch;
END;
$$;

-- Garantir que a função tem as permissões corretas
GRANT EXECUTE ON FUNCTION public.create_single_session(text, text, text, text, text, text) TO authenticated;

-- Comentário para auditoria
COMMENT ON FUNCTION public.create_single_session IS 'v1.0 - P0 FIX: Owner pode ter múltiplas sessões simultâneas. Outros usuários mantêm sessão única.';